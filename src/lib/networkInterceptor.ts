// Network interceptor to handle external service requests gracefully

class NetworkInterceptor {
  private static externalDomains = [
    'appsignal-endpoint.net',
    'browser.sentry-cdn.com',
    'sentry.io'
  ];

  static init() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        
        // Check if it's an external monitoring service
        if (this.externalDomains.some(domain => url.includes(domain))) {
          // Return a mock successful response to prevent errors
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        
        // For all other requests, proceed normally
        return await originalFetch(...args);
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        
        // If it's an external service, suppress the error
        if (this.externalDomains.some(domain => url.includes(domain))) {
          return new Response(JSON.stringify({ error: 'External service unavailable' }), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Re-throw for internal services
        throw error;
      }
    };

    console.log('🌐 Network interceptor ativado - requisições externas filtradas');
  }
}

// Auto-initialize
NetworkInterceptor.init();

export { NetworkInterceptor };