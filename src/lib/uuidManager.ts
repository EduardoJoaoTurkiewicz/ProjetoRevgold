// UUID management system for consistent ID handling across offline/online modes

export class UUIDManager {
  private static uuidMap = new Map<string, string>();
  
  // Generate a proper UUID
  static generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Generate a temporary offline ID that can be mapped to a real UUID later
  static generateOfflineId(): string {
    const uuid = this.generateUUID();
    const offlineId = `offline-${Date.now()}-${uuid}`;
    return offlineId;
  }

  // Check if an ID is a valid UUID
  static isValidUUID(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  // Check if an ID is an offline ID
  static isOfflineId(id: string): boolean {
    return id && typeof id === 'string' && id.startsWith('offline-');
  }

  // Map offline ID to real UUID
  static mapOfflineToReal(offlineId: string, realId: string): void {
    this.uuidMap.set(offlineId, realId);
  }

  // Get real ID from offline ID
  static getRealId(id: string): string {
    if (this.isOfflineId(id)) {
      return this.uuidMap.get(id) || id;
    }
    return id;
  }

  // Clean UUID field - convert empty strings and invalid values to null
  static cleanUUIDField(value: any): string | null {
    if (!value) return null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
    if (this.isOfflineId(trimmed)) return null; // Convert offline IDs to null for DB operations
    if (!this.isValidUUID(trimmed)) return null;
    return trimmed;
  }

  // Clean all UUID fields in an object
  static cleanObjectUUIDs(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.cleanObjectUUIDs(item));

    const cleaned = { ...obj };
    
    // List of fields that should be UUIDs
    const uuidFields = [
      'id', 'sellerId', 'employeeId', 'saleId', 'debtId', 'checkId', 'boletoId',
      'relatedId', 'parentId', 'customerId', 'productId', 'transactionId',
      'seller_id', 'employee_id', 'sale_id', 'debt_id', 'check_id', 'boleto_id',
      'related_id', 'parent_id', 'customer_id', 'product_id', 'transaction_id'
    ];

    uuidFields.forEach(field => {
      if (cleaned[field] !== undefined) {
        cleaned[field] = this.cleanUUIDField(cleaned[field]);
      }
    });

    // Clean nested objects
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
        cleaned[key] = this.cleanObjectUUIDs(cleaned[key]);
      } else if (Array.isArray(cleaned[key])) {
        cleaned[key] = cleaned[key].map((item: any) => this.cleanObjectUUIDs(item));
      }
    });

    return cleaned;
  }
}