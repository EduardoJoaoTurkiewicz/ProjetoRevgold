// Console filter to suppress external service errors

class ConsoleFilter {
  private static originalMethods = {
    error: console.error,
    warn: console.warn,
    log: console.log
  };

  private static externalPatterns = [
    /appsignal-endpoint\.net/,
    /browser\.sentry-cdn\.com/,
    /stackblitz\.com\/api/,
    /Failed to fetch.*appsignal/,
    /Failed to fetch.*sentry/,
    /CORS policy.*appsignal/,
    /CORS policy.*sentry/,
    /body stream already read/,
    /Watcher has not received all expected events/,
    /BadServerResponse/,
    /React Router Future Flag Warning/,
    /v7_startTransition/,
    /v7_relativeSplatPath/
  ];

  static init() {
    // Filter console.error
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Check if it's an external service error
      if (this.externalPatterns.some(pattern => pattern.test(message))) {
        return; // Suppress external errors
      }
      
      // Allow project-related errors
      this.originalMethods.error.apply(console, args);
    };

    // Filter console.warn
    console.warn = (...args) => {
      const message = args.join(' ');
      
      // Check if it's an external service warning
      if (this.externalPatterns.some(pattern => pattern.test(message))) {
        return; // Suppress external warnings
      }
      
      // Allow project-related warnings
      this.originalMethods.warn.apply(console, args);
    };

    console.log('🔇 Console filter ativado - erros externos suprimidos');
  }

  static restore() {
    console.error = this.originalMethods.error;
    console.warn = this.originalMethods.warn;
    console.log = this.originalMethods.log;
    console.log('🔊 Console filter desativado');
  }
}

// Auto-initialize
ConsoleFilter.init();

export { ConsoleFilter };