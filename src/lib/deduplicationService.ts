// Service to handle data deduplication and uniqueness checks

import { UUIDManager } from './uuidManager';
import { supabase } from './supabase';

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingId?: string;
  reason?: string;
}

export class DeduplicationService {
  // Check if a sale already exists
  static async checkSaleDuplicate(saleData: any): Promise<DeduplicationResult> {
    try {
      // First check by ID if it's a valid UUID
      if (saleData.id && UUIDManager.isValidUUID(saleData.id)) {
        const { data: existingById } = await supabase
          .from('sales')
          .select('id')
          .eq('id', saleData.id)
          .single();
        
        if (existingById) {
          return {
            isDuplicate: true,
            existingId: existingById.id,
            reason: 'ID already exists'
          };
        }
      }

      // Check by business logic: client + date + total value
      const { data: existingByData } = await supabase
        .from('sales')
        .select('id')
        .eq('client', saleData.client)
        .eq('date', saleData.date)
        .eq('total_value', saleData.totalValue || saleData.total_value);
      
      if (existingByData && existingByData.length > 0) {
        return {
          isDuplicate: true,
          existingId: existingByData[0].id,
          reason: 'Same client, date, and total value'
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.warn('Could not check for sale duplicates:', error);
      return { isDuplicate: false };
    }
  }

  // Check if a debt already exists
  static async checkDebtDuplicate(debtData: any): Promise<DeduplicationResult> {
    try {
      // First check by ID if it's a valid UUID
      if (debtData.id && UUIDManager.isValidUUID(debtData.id)) {
        const { data: existingById } = await supabase
          .from('debts')
          .select('id')
          .eq('id', debtData.id)
          .single();
        
        if (existingById) {
          return {
            isDuplicate: true,
            existingId: existingById.id,
            reason: 'ID already exists'
          };
        }
      }

      // Check by business logic: company + date + total value
      const { data: existingByData } = await supabase
        .from('debts')
        .select('id')
        .eq('company', debtData.company)
        .eq('date', debtData.date)
        .eq('total_value', debtData.totalValue || debtData.total_value);
      
      if (existingByData && existingByData.length > 0) {
        return {
          isDuplicate: true,
          existingId: existingByData[0].id,
          reason: 'Same company, date, and total value'
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.warn('Could not check for debt duplicates:', error);
      return { isDuplicate: false };
    }
  }

  // Check if an employee already exists
  static async checkEmployeeDuplicate(employeeData: any): Promise<DeduplicationResult> {
    try {
      // First check by ID if it's a valid UUID
      if (employeeData.id && UUIDManager.isValidUUID(employeeData.id)) {
        const { data: existingById } = await supabase
          .from('employees')
          .select('id')
          .eq('id', employeeData.id)
          .single();
        
        if (existingById) {
          return {
            isDuplicate: true,
            existingId: existingById.id,
            reason: 'ID already exists'
          };
        }
      }

      // Check by business logic: name + position
      const { data: existingByData } = await supabase
        .from('employees')
        .select('id')
        .eq('name', employeeData.name)
        .eq('position', employeeData.position);
      
      if (existingByData && existingByData.length > 0) {
        return {
          isDuplicate: true,
          existingId: existingByData[0].id,
          reason: 'Same name and position'
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.warn('Could not check for employee duplicates:', error);
      return { isDuplicate: false };
    }
  }

  // Generic duplicate checker for other entities
  static async checkGenericDuplicate(
    table: string, 
    data: any, 
    uniqueFields: string[]
  ): Promise<DeduplicationResult> {
    try {
      // First check by ID if it's a valid UUID
      if (data.id && UUIDManager.isValidUUID(data.id)) {
        const { data: existingById } = await supabase
          .from(table)
          .select('id')
          .eq('id', data.id)
          .single();
        
        if (existingById) {
          return {
            isDuplicate: true,
            existingId: existingById.id,
            reason: 'ID already exists'
          };
        }
      }

      // Build query for unique fields
      let query = supabase.from(table).select('id');
      
      uniqueFields.forEach(field => {
        if (data[field] !== undefined) {
          query = query.eq(field, data[field]);
        }
      });
      
      const { data: existingByData } = await query;
      
      if (existingByData && existingByData.length > 0) {
        return {
          isDuplicate: true,
          existingId: existingByData[0].id,
          reason: `Duplicate found by: ${uniqueFields.join(', ')}`
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.warn(`Could not check for ${table} duplicates:`, error);
      return { isDuplicate: false };
    }
  }

  // Remove duplicates from an array based on ID
  static removeDuplicatesById<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.id)) {
        console.warn('🔍 Duplicate removed:', item.id);
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }

  // Remove duplicates from an array based on custom logic
  static removeDuplicatesByLogic<T>(
    items: T[], 
    getKey: (item: T) => string
  ): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = getKey(item);
      if (seen.has(key)) {
        console.warn('🔍 Logical duplicate removed:', key);
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Merge two arrays, preferring online data over offline data
  static mergeArrays<T extends { id: string }>(
    onlineData: T[], 
    offlineData: T[]
  ): T[] {
    const merged = [...onlineData];
    const onlineIds = new Set(onlineData.map(item => item.id));
    
    // Add offline data that doesn't exist online
    offlineData.forEach(offlineItem => {
      if (!onlineIds.has(offlineItem.id)) {
        merged.push({
          ...offlineItem,
          isOffline: true
        } as T & { isOffline: boolean });
      }
    });
    
    return this.removeDuplicatesById(merged);
  }
}