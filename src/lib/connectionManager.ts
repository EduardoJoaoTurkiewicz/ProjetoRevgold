import { testSupabaseConnection, isSupabaseConfigured } from './supabase';
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
    this.initialCheck();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Navegador online');
      this.updateStatus({ isOnline: true });
      this.checkSupabaseConnection();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Navegador offline');
      this.updateStatus({ 
        isOnline: false, 
        isSupabaseReachable: false 
      });
    });
  }

  private async initialCheck() {
    if (this.status.isOnline) {
      await this.checkSupabaseConnection();
    }
  }

  private startPeriodicCheck() {
    // Verificar conexão a cada 30 segundos
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

    // Notificar todos os listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Erro no listener de status de conexão:', error);
      }
    });
  }

  public async checkSupabaseConnection(): Promise<boolean> {
    if (!this.status.isOnline) {
      return false;
    }

    if (!isSupabaseConfigured()) {
      this.updateStatus({ 
        isSupabaseReachable: false,
        retryCount: 0
      });
      return false;
    }

    try {
      const { success } = await testSupabaseConnection();
      
      this.updateStatus({ 
        isSupabaseReachable: success,
        retryCount: success ? 0 : this.status.retryCount + 1
      });

      if (success) {
        console.log('✅ Conexão com Supabase verificada');
      } else {
        console.warn('⚠️ Supabase não acessível');
      }

      return success;
    } catch (error) {
      console.warn('⚠️ Falha na verificação de conexão:', error);
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
    
    // Retornar função para cancelar inscrição
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

// Instância singleton
export const connectionManager = new ConnectionManager();

// Função utilitária para verificar se um erro é relacionado à rede
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

// Wrapper seguro para chamadas do Supabase
export async function safeSupabaseCall<T>(
  fn: () => Promise<T>,
  fallbackValue?: T
): Promise<{ data?: T; error?: any; offline?: boolean }> {
  try {
    // Verificar se estamos online
    if (!navigator.onLine) {
      return { offline: true };
    }

    // Verificar se o Supabase está configurado
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase não configurado, trabalhando offline');
      return { offline: true };
    }

    const data = await fn();
    
    // Atualizar status de conexão em caso de sucesso
    connectionManager.updateStatus({ 
      isSupabaseReachable: true,
      retryCount: 0
    });
    
    return { data };
  } catch (error) {
    ErrorHandler.logProjectError(error, 'Safe Supabase Call');
    
    // Verificar se é erro de rede
    if (isNetworkError(error)) {
      console.warn('⚠️ Erro de rede detectado, trabalhando offline:', error.message);
      connectionManager.updateStatus({ isSupabaseReachable: false });
      return { offline: true, error };
    }
    
    // Para erros não relacionados à rede, ainda lançá-los
    return { error };
  }
}