// Error handler para filtrar erros externos e focar nos erros do projeto

export class ErrorHandler {
  private static ignoredDomains = [
    'appsignal-endpoint.net',
    'sentry.io',
    'browser.sentry-cdn.com',
    'stackblitz.com'
  ];

  static shouldIgnoreError(error: Error | string): boolean {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // Ignorar erros de CORS de serviços externos
    if (errorMessage.includes('CORS policy') && 
        this.ignoredDomains.some(domain => errorMessage.includes(domain))) {
      return true;
    }
    
    // Ignorar erros de fetch para serviços de monitoramento
    if (errorMessage.includes('Failed to fetch') && 
        this.ignoredDomains.some(domain => errorMessage.includes(domain))) {
      return true;
    }
    
    // Ignorar erros específicos do Bolt.new
    if (errorMessage.includes('body stream already read') ||
        errorMessage.includes('Watcher has not received all expected events') ||
        errorMessage.includes('BadServerResponse')) {
      return true;
    }
    
    return false;
  }

  static logProjectError(error: Error | string, context?: string) {
    if (this.shouldIgnoreError(error)) {
      return; // Não logar erros externos
    }
    
    console.group(`🚨 Erro do Projeto${context ? ` - ${context}` : ''}`);
    console.error('Erro:', error);
    console.error('Timestamp:', new Date().toISOString());
    if (context) {
      console.error('Contexto:', context);
    }
    console.groupEnd();
  }

  static handleSupabaseError(error: any): string {
    if (!error) return 'Erro desconhecido';
    
    const message = error.message || error.toString();
    
    // Erros de configuração
    if (message.includes('não está configurado') || 
        message.includes('not configured') ||
        message.includes('placeholder')) {
      return 'Supabase não configurado. Configure o arquivo .env com suas credenciais.';
    }
    
    // Erros de conexão
    if (message.includes('Failed to fetch') || 
        message.includes('Network error') ||
        message.includes('fetch')) {
      return 'Erro de conexão. Verifique sua internet e as configurações do Supabase.';
    }
    
    // Erros de autenticação
    if (message.includes('Invalid API key') || 
        message.includes('unauthorized') ||
        message.includes('401')) {
      return 'Credenciais inválidas. Verifique sua VITE_SUPABASE_ANON_KEY.';
    }
    
    // Erros de banco de dados
    if (message.includes('relation') && message.includes('does not exist')) {
      return 'Tabela não encontrada. Execute as migrações do banco de dados.';
    }
    
    return message;
  }
}

// Interceptar erros globais e filtrar os irrelevantes
window.addEventListener('error', (event) => {
  if (ErrorHandler.shouldIgnoreError(event.error || event.message)) {
    event.preventDefault(); // Prevenir que apareça no console
    return;
  }
  
  ErrorHandler.logProjectError(event.error || event.message, 'Global Error');
});

window.addEventListener('unhandledrejection', (event) => {
  if (ErrorHandler.shouldIgnoreError(event.reason)) {
    event.preventDefault(); // Prevenir que apareça no console
    return;
  }
  
  ErrorHandler.logProjectError(event.reason, 'Unhandled Promise Rejection');
});