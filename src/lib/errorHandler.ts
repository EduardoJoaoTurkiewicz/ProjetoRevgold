// Error handler para filtrar erros externos e focar nos erros do projeto

export class ErrorHandler {
  private static ignoredDomains = [
    'appsignal-endpoint.net',
    'browser.sentry-cdn.com',
    'sentry.io',
    'stackblitz.com'
    'bolt.new'
  ];

  private static ignoredMessages = [
    'Failed to fetch',
    'CORS policy',
    'body stream already read',
    'Watcher has not received all expected events',
    'BadServerResponse',
    'An unexpected status code 400 response was received',
    'Failed to load resource',
    'net::ERR_FAILED'
  ];

  static shouldIgnoreError(error: Error | string): boolean {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'object' && error.stack ? error.stack : '';
    
    // Ignorar erros que contêm domínios externos
    if (this.ignoredDomains.some(domain => 
        errorMessage.includes(domain) || errorStack.includes(domain))) {
      return true;
    }
    
    // Ignorar mensagens específicas de erros externos
    if (this.ignoredMessages.some(msg => errorMessage.includes(msg))) {
      // Mas permitir se for erro do nosso projeto (Supabase)
      if (errorMessage.includes('supabase') || 
          errorMessage.includes('VITE_SUPABASE') ||
          errorMessage.includes('não está configurado')) {
        return false; // Não ignorar erros do Supabase
      }
      return true;
    }
    
    // Ignorar erros específicos do ambiente de desenvolvimento
    if (errorMessage.includes('React Router Future Flag Warning') ||
        errorMessage.includes('Future Flag Warning') ||
        errorMessage.includes('v7_startTransition') ||
        errorMessage.includes('v7_relativeSplatPath')) {
      return true;
    }
    
    return false;
  }

  static isProjectError(error: Error | string): boolean {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // Erros relacionados ao nosso projeto
    return errorMessage.includes('supabase') ||
           errorMessage.includes('VITE_SUPABASE') ||
           errorMessage.includes('RevGold') ||
           errorMessage.includes('createSale') ||
           errorMessage.includes('loadAllData') ||
           errorMessage.includes('AppContext') ||
           errorMessage.includes('não está configurado');
  }

  static logProjectError(error: Error | string, context?: string) {
    if (this.shouldIgnoreError(error)) {
      return; // Não logar erros externos
    }
    
    // Apenas logar erros relevantes do projeto
    if (this.isProjectError(error)) {
      console.group(`🚨 Erro do Projeto${context ? ` - ${context}` : ''}`);
      console.error('Erro:', error);
      console.error('Timestamp:', new Date().toISOString());
      if (context) {
        console.error('Contexto:', context);
      }
      console.groupEnd();
    }
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

  static suppressExternalErrors() {
    // Interceptar e filtrar erros de console
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      const message = args.join(' ');
      if (!this.shouldIgnoreError(message)) {
        originalError.apply(console, args);
      }
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      if (!message.includes('React Router Future Flag Warning') &&
          !message.includes('Future Flag Warning')) {
        originalWarn.apply(console, args);
      }
    };
  }
}

// Suprimir erros de console externos
ErrorHandler.suppressExternalErrors();

// Interceptar erros globais e filtrar apenas os relevantes
window.addEventListener('error', (event) => {
  if (ErrorHandler.shouldIgnoreError(event.error || event.message)) {
    event.preventDefault(); // Prevenir que apareça no console
    return;
  }
  
  // Apenas logar se for erro do projeto
  if (ErrorHandler.isProjectError(event.error || event.message)) {
    ErrorHandler.logProjectError(event.error || event.message, 'Global Error');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (ErrorHandler.shouldIgnoreError(event.reason)) {
    event.preventDefault(); // Prevenir que apareça no console
    return;
  }
  
  // Apenas logar se for erro do projeto
  if (ErrorHandler.isProjectError(event.reason)) {
    ErrorHandler.logProjectError(event.reason, 'Unhandled Promise Rejection');
  }
});

// Interceptar fetch errors para serviços externos
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    return await originalFetch(...args);
  } catch (error) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    
    // Silenciar erros de fetch para domínios externos
    if (ErrorHandler.ignoredDomains.some(domain => url.includes(domain))) {
      // Retornar uma resposta mock para não quebrar o fluxo
      return new Response('{}', { 
        status: 200, 
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
};