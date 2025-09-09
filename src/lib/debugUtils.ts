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

    if (!payload.totalValue || typeof payload.totalValue !== 'number' || payload.totalValue <= 0) {
      errors.push('Valor total deve ser um número maior que zero');
    }

    if (!payload.paymentMethods || !Array.isArray(payload.paymentMethods) || payload.paymentMethods.length === 0) {
      errors.push('Pelo menos um método de pagamento é obrigatório');
    }

    // Payment methods validation
    if (payload.paymentMethods && Array.isArray(payload.paymentMethods)) {
      payload.paymentMethods.forEach((method: any, index: number) => {
        if (!method.type || typeof method.type !== 'string') {
          errors.push(`Método ${index + 1}: Tipo é obrigatório`);
        }
        if (typeof method.amount !== 'number' || method.amount <= 0) {
          errors.push(`Método ${index + 1}: Valor deve ser maior que zero`);
        }
      });
    }

    // Seller ID validation
    if (payload.sellerId && typeof payload.sellerId === 'string') {
      if (payload.sellerId.trim() === '') {
        errors.push('Seller ID não pode ser string vazia (use null)');
      } else if (!isValidUUID(payload.sellerId)) {
        errors.push('Seller ID deve ser um UUID válido ou null');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export isValidUUID function that was missing
export function isValidUUID(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}