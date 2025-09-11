// Debug utilities for troubleshooting sales creation issues

import { debugService } from './supabaseServices';
import { ErrorHandler } from './errorHandler';

export interface SaleCreationError {
  id: string;
  payload: any;
  error_message: string;
  created_at: string;
}

export class SalesDebugger {
  static async logSaleCreationAttempt(payload: any, context: string = 'unknown') {
    console.group(`🔍 Sale Creation Debug - ${context}`);
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('🔍 Payload Analysis:', this.analyzePayload(payload));
    console.groupEnd();
  }

  static analyzePayload(payload: any) {
    const analysis = {
      hasClient: !!payload.client,
      clientType: typeof payload.client,
      clientValue: payload.client,
      hasSellerId: !!payload.sellerId,
      sellerIdType: typeof payload.sellerId,
      sellerIdValue: payload.sellerId,
      hasPaymentMethods: !!payload.paymentMethods,
      paymentMethodsCount: Array.isArray(payload.paymentMethods) ? payload.paymentMethods.length : 0,
      totalValue: payload.totalValue,
      totalValueType: typeof payload.totalValue,
      receivedAmount: payload.receivedAmount,
      pendingAmount: payload.pendingAmount,
      status: payload.status
    };

    // Check for common issues
    const issues = [];
    
    if (!analysis.hasClient) {
      issues.push('❌ Missing client field');
    } else if (analysis.clientType !== 'string') {
      issues.push('❌ Client is not a string');
    } else if (analysis.clientValue && analysis.clientValue.length === 36) {
      issues.push('⚠️ Client looks like a UUID (should be name)');
    }
    
    if (analysis.hasSellerId && analysis.sellerIdType === 'string' && analysis.sellerIdValue === '') {
      issues.push('❌ Seller ID is empty string (should be null)');
    }
    
    if (analysis.totalValueType !== 'number' || analysis.totalValue <= 0) {
      issues.push('❌ Invalid total value');
    }
    
    if (!analysis.hasPaymentMethods || analysis.paymentMethodsCount === 0) {
      issues.push('❌ No payment methods');
    }

    return {
      ...analysis,
      issues,
      isValid: issues.length === 0
    };
  }

  static async getRecentErrors(limit: number = 10): Promise<SaleCreationError[]> {
    try {
      return await debugService.getRecentSaleErrors(limit);
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Fetch Debug Errors');
      return [];
    }
  }

  static async cleanupOldErrors(daysOld: number = 30): Promise<number> {
    try {
      return await debugService.cleanupOldErrors(daysOld);
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Cleanup Old Errors');
      return 0;
    }
  }

  static validateSalePayload(payload: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!payload.client || typeof payload.client !== 'string' || !payload.client.trim()) {
      errors.push('Cliente é obrigatório');
    }

    // Enhanced client validation - comprehensive UUID detection
    if (payload.client && typeof payload.client === 'string' && payload.client.length === 36) {
      if (isValidUUID(payload.client)) {
        errors.push('Cliente parece ser um UUID - use o nome do cliente');
      }
    }
    
    // Additional client validation - check for common UUID patterns
    if (payload.client && typeof payload.client === 'string') {
      const client = payload.client.trim();
      if (client.includes('-') && client.length >= 32 && /^[0-9a-f-]+$/i.test(client)) {
        errors.push('Cliente parece conter caracteres de UUID - use o nome real do cliente');
      }
    }
    
    if (!payload.totalValue || typeof payload.totalValue !== 'number' || payload.totalValue <= 0) {
      errors.push('Valor total deve ser um número maior que zero');
    }

    if (!payload.paymentMethods || !Array.isArray(payload.paymentMethods) || payload.paymentMethods.length === 0) {
      errors.push('Pelo menos um método de pagamento é obrigatório');
    }

    // Enhanced payment methods validation with comprehensive UUID checking
    if (payload.paymentMethods && Array.isArray(payload.paymentMethods)) {
      payload.paymentMethods.forEach((method: any, index: number) => {
        if (!method.type || typeof method.type !== 'string') {
          errors.push(`Método ${index + 1}: Tipo é obrigatório`);
        }
        if (typeof method.amount !== 'number' || method.amount <= 0) {
          errors.push(`Método ${index + 1}: Valor deve ser maior que zero`);
        }
        
        // Comprehensive UUID field validation in payment methods
        Object.keys(method).forEach(key => {
          const isUUIDField = key.endsWith('Id') || key.endsWith('_id') || key === 'id' ||
              ['customerId', 'productId', 'paymentMethodId', 'referenceId', 'transactionId',
               'customer_id', 'product_id', 'payment_method_id', 'reference_id', 'transaction_id'].includes(key);
          
          if (isUUIDField) {
            const value = method[key];
            if (value === '') {
              errors.push(`Método ${index + 1}: Campo ${key} não pode ser string vazia (use null)`);
            } else if (value && typeof value === 'string' && !isValidUUID(value)) {
              errors.push(`Método ${index + 1}: Campo ${key} deve ser UUID válido ou null`);
            } else if (value && typeof value === 'string' && value.startsWith('offline-')) {
              errors.push(`Método ${index + 1}: Campo ${key} contém ID temporário offline - deve ser convertido`);
            }
          }
        });
      });
    }

    // Enhanced seller ID validation
    if (payload.sellerId && typeof payload.sellerId === 'string') {
      if (payload.sellerId.trim() === '') {
        errors.push('Seller ID não pode ser string vazia (use null)');
      } else if (payload.sellerId.startsWith('offline-')) {
        errors.push('Seller ID contém ID temporário offline - deve ser convertido ou removido');
      } else if (!isValidUUID(payload.sellerId)) {
        errors.push('Seller ID deve ser um UUID válido ou null');
      }
    }

    // Comprehensive UUID field validation for all possible fields
    ['customerId', 'paymentMethodId', 'saleId', 'customer_id', 'product_id', 
     'payment_method_id', 'sale_id', 'debt_id', 'check_id', 'boleto_id',
     'related_id', 'transaction_id', 'reference_id', 'parent_id'].forEach(field => {
      const value = payload[field];
      if (value === '') {
        errors.push(`Campo ${field} não pode ser string vazia (use null)`);
      } else if (value && typeof value === 'string' && value.startsWith('offline-')) {
        errors.push(`Campo ${field} contém ID temporário offline - deve ser convertido`);
      } else if (value && typeof value === 'string' && !isValidUUID(value)) {
        errors.push(`Campo ${field} deve ser UUID válido ou null`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Enhanced UUID validation function
export function isValidUUID(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // Check for offline temporary IDs
  if (value.startsWith('offline-') || value.startsWith('temp-')) {
    return false;
  }
  
  // Standard UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Enhanced offline ID detection
export function isOfflineId(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith('offline-') || value.startsWith('temp-') || value.includes('local-');
}

// Convert offline IDs to null for database operations
export function convertOfflineIdsToNull(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const converted = { ...obj };
  
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    if (typeof value === 'string' && isOfflineId(value)) {
      console.warn(`🔄 Converting offline ID to null for ${key}:`, value);
      converted[key] = null;
    } else if (Array.isArray(value)) {
      converted[key] = value.map(item => convertOfflineIdsToNull(item));
    } else if (value && typeof value === 'object') {
      converted[key] = convertOfflineIdsToNull(value);
    }
  });
  
  return converted;
}