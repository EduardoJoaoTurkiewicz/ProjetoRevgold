// Number utilities to prevent NaN values throughout the system

export function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return defaultValue;
    
    // Handle Brazilian currency format
    const cleaned = trimmed.replace(/[R$\s]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  const converted = Number(value);
  return isNaN(converted) ? defaultValue : converted;
}

export function safeCurrency(value: any): string {
  const num = safeNumber(value, 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

export function safePercent(value: any): string {
  const num = safeNumber(value, 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(num / 100);
}

export function validateMonetaryValue(value: any, fieldName: string): number {
  const result = safeNumber(value);
  
  if (result < 0) {
    console.warn(`⚠️ Negative value detected for ${fieldName}:`, value, '-> converted to 0');
    return 0;
  }
  
  if (value !== null && value !== undefined && value !== '' && result === 0 && value !== 0) {
    console.warn(`⚠️ Invalid monetary value for ${fieldName}:`, value, '-> converted to 0');
  }
  
  return result;
}

export function sumSafe(values: any[]): number {
  return values.reduce((sum, value) => sum + safeNumber(value, 0), 0);
}

export function calculatePercentage(part: any, total: any): number {
  const safePart = safeNumber(part, 0);
  const safeTotal = safeNumber(total, 0);
  
  if (safeTotal === 0) return 0;
  return (safePart / safeTotal) * 100;
}

// Validate and clean data from Supabase
export function sanitizeSupabaseData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeSupabaseData(item));
  }
  
  const sanitized = { ...data };
  
  // Common monetary fields to sanitize
  const monetaryFields = [
    'amount', 'value', 'total_value', 'totalValue',
    'received_amount', 'receivedAmount', 'pending_amount', 'pendingAmount',
    'paid_amount', 'paidAmount', 'current_balance', 'currentBalance',
    'initial_balance', 'initialBalance', 'salary', 'commission_amount',
    'commissionAmount', 'hourly_rate', 'hourlyRate', 'total_amount',
    'totalAmount', 'installment_value', 'installmentValue', 'final_amount',
    'finalAmount', 'interest_amount', 'interestAmount', 'penalty_amount',
    'penaltyAmount', 'notary_costs', 'notaryCosts', 'interest_paid',
    'interestPaid', 'sale_value', 'saleValue', 'commission_rate',
    'commissionRate', 'custom_commission_rate', 'customCommissionRate'
  ];
  
  monetaryFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      const originalValue = sanitized[field];
      sanitized[field] = safeNumber(originalValue, 0);
      
      if (originalValue !== sanitized[field] && originalValue !== null && originalValue !== undefined) {
        console.warn(`🔧 Sanitized ${field}:`, originalValue, '->', sanitized[field]);
      }
    }
  });
  
  // Sanitize nested payment methods
  if (sanitized.payment_methods || sanitized.paymentMethods) {
    const paymentMethods = sanitized.payment_methods || sanitized.paymentMethods;
    if (Array.isArray(paymentMethods)) {
      const sanitizedMethods = paymentMethods.map(method => {
        if (method && typeof method === 'object') {
          return {
            ...method,
            amount: safeNumber(method.amount, 0),
            installmentValue: safeNumber(method.installmentValue, 0),
            installments: safeNumber(method.installments, 1),
            installmentInterval: safeNumber(method.installmentInterval, 30)
          };
        }
        return method;
      });
      
      if (sanitized.payment_methods) {
        sanitized.payment_methods = sanitizedMethods;
      }
      if (sanitized.paymentMethods) {
        sanitized.paymentMethods = sanitizedMethods;
      }
    }
  }
  
  return sanitized;
}

// Log monetary values for debugging
export function logMonetaryValues(data: any, context: string): void {
  if (!data || typeof data !== 'object') return;
  
  const monetaryFields = [
    'amount', 'value', 'totalValue', 'receivedAmount', 'pendingAmount',
    'paidAmount', 'currentBalance', 'initialBalance', 'salary'
  ];
  
  const values: { [key: string]: any } = {};
  monetaryFields.forEach(field => {
    if (data[field] !== undefined) {
      values[field] = {
        original: data[field],
        type: typeof data[field],
        safe: safeNumber(data[field], 0),
        isNaN: isNaN(Number(data[field]))
      };
    }
  });
  
  if (Object.keys(values).length > 0) {
    console.log(`💰 Monetary values in ${context}:`, values);
  }
}