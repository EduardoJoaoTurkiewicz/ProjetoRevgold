import { ErrorHandler } from './errorHandler';

export interface ConnectionStatus {
  isOnline: boolean;
  isSupabaseReachable: boolean;
  lastCheck: number;
  retryCount: number;
}

class ConnectionManager {
  private status: ConnectionStatus = {
    isOnline: navigator.onLine,
    isSupabaseReachable: false,
    lastCheck: 0,
    retryCount: 0
  };

  private listeners: ((status: ConnectionStatus) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupEventListeners();
    this.startPeriodicCheck();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Browser is online');
      this.updateStatus({ isOnline: true });
      this.checkSupabaseConnection();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Browser is offline');
      this.updateStatus({ 
        isOnline: false, 
        isSupabaseReachable: false 
      });
    });
  }

  private startPeriodicCheck() {
    // Check connection every 30 seconds
    this.checkInterval = setInterval(() => {
      if (this.status.isOnline) {
        this.checkSupabaseConnection();
      }
    }, 30000);
  }

  private updateStatus(updates: Partial<ConnectionStatus>) {
    this.status = {
      ...this.status,
      ...updates,
      lastCheck: Date.now()
    };

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  public async checkSupabaseConnection(): Promise<boolean> {
    if (!this.status.isOnline) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Import supabase client for proper connection testing
      const { supabase } = await import('./supabase');
      
      // Test with a simple query
      const { error } = await supabase
        .from('sales')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      const isReachable = !error;
      this.updateStatus({ 
        isSupabaseReachable: isReachable,
        retryCount: isReachable ? 0 : this.status.retryCount + 1
      });

      if (isReachable) {
        console.log('✅ Supabase connection verified');
      } else {
        console.warn('⚠️ Supabase not reachable, error:', error?.message);
      }

      return isReachable;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Supabase connection timeout');
      } else {
        console.warn('⚠️ Supabase connection check failed:', error);
      }
      this.updateStatus({ 
        isSupabaseReachable: false,
        retryCount: this.status.retryCount + 1
      });
      return false;
    }
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  public isConnected(): boolean {
    return this.status.isOnline && this.status.isSupabaseReachable;
  }

  public addListener(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async forceCheck(): Promise<boolean> {
    if (!this.status.isOnline) {
      return false;
    }
    
    return await this.checkSupabaseConnection();
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.listeners = [];
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager();

// Utility function to check if an error is network-related
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message || error.toString();
  
  return (
    message.includes('Failed to fetch') ||
    message.includes('Network error') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    error.name === 'AbortError' ||
    error.code === 'NETWORK_ERROR' ||
    (error.status && error.status >= 500)
  );
}

// Safe wrapper for Supabase calls
export async function safeSupabaseCall<T>(
  fn: () => Promise<T>,
  fallbackValue?: T
): Promise<{ data?: T; error?: any; offline?: boolean }> {
  try {
    // Check if we're online first
    if (!navigator.onLine) {
      return { offline: true };
    }

    // Check if Supabase is configured
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key || url === 'https://your-project-id.supabase.co' || key === 'your-anon-key-here') {
      console.warn('⚠️ Supabase not configured, working offline');
      return { offline: true };
    }

    const data = await fn();
    
    // Update connection status on success
    connectionManager.updateStatus({ 
      isSupabaseReachable: true,
      retryCount: 0
    });
    
    return { data };
  } catch (error) {
    ErrorHandler.logProjectError(error, 'Safe Supabase Call');
    
    // Check if it's a network error
    if (isNetworkError(error)) {
      console.warn('⚠️ Network error detected, working offline:', error.message);
      connectionManager.updateStatus({ isSupabaseReachable: false });
      return { offline: true, error };
    }
    
    // For non-network errors, still throw them
    return { error };
  }
}