import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ErrorHandler } from '../lib/errorHandler';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log if it's a project-related error
    if (ErrorHandler.isProjectError(error)) {
      ErrorHandler.logProjectError(error, 'React Error Boundary');
      console.log('🔍 Component stack:', errorInfo.componentStack);
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Use React state reset instead of page reload
    window.location.hash = '';
    window.location.hash = '#';
  };

  render() {
    if (this.state.hasError) {
      const isSupabaseError = this.state.error?.message?.includes('supabase') || 
                             this.state.error?.message?.includes('VITE_SUPABASE');

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/50 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 rounded-2xl">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Oops! Algo deu errado</h1>
                    <p className="text-red-100 text-lg">
                      {isSupabaseError ? 'Erro de configuração do banco de dados' : 'Erro inesperado na aplicação'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {isSupabaseError ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                      <h3 className="font-bold text-blue-900 mb-4">Como resolver:</h3>
                      <ol className="space-y-2 text-blue-800">
                        <li className="flex items-start gap-2">
                          <span className="font-bold">1.</span>
                          <span>Abra o arquivo <code className="bg-blue-100 px-2 py-1 rounded">.env</code> na raiz do projeto</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold">2.</span>
                          <span>Configure suas credenciais do Supabase:</span>
                        </li>
                        <li className="ml-6 bg-blue-100 p-3 rounded-lg font-mono text-sm">
                          VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co<br/>
                          VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold">3.</span>
                          <span>Reinicie o servidor de desenvolvimento</span>
                        </li>
                      </ol>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <p className="text-yellow-800 text-sm">
                        <strong>💡 Dica:</strong> Encontre suas credenciais em: 
                        <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline ml-1">
                          Supabase Dashboard → Seu Projeto → Settings → API
                        </a>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-2xl">
                      <h3 className="font-bold text-gray-900 mb-2">Detalhes do erro:</h3>
                      <p className="text-gray-700 font-mono text-sm bg-gray-100 p-3 rounded">
                        {this.state.error?.message || 'Erro desconhecido'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-blue-800 text-sm">
                        Este erro foi registrado automaticamente. Se o problema persistir, 
                        tente recarregar a página ou entre em contato com o suporte.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Recarregar Aplicação
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="bg-white text-gray-700 font-bold py-4 px-6 rounded-xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <Home className="w-5 h-5" />
                    Ir para Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}