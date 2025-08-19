import React, { useState } from 'react';
                O Supabase é um banco de dados gratuito que permitirá que TODOS os sócios acessem os mesmos dados de qualquer dispositivo.

interface SupabaseSetupProps {
  onClose: () => void;
  onConfigured: () => void;
                  <span className="text-blue-800">Gratuito para até 50.000 registros</span>

export function SupabaseSetup({ onClose, onConfigured }: SupabaseSetupProps) {
  const [step, setStep] = useState(1);
                  <span className="text-blue-800">Dados sincronizados em tempo real</span>
    url: '',
    anonKey: ''
  });
                  <span className="text-blue-800">Todos os sócios veem os mesmos dados</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-blue-800">Backup automático e seguro</span>
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!credentials.url || !credentials.anonKey) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Test connection
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(credentials.url, credentials.anonKey);
              <h3 className="text-xl font-bold text-green-900 mb-4">🚀 Configuração para Múltiplos Usuários:</h3>
      // Test the connection
      const { error: testError } = await testClient.from('users').select('count').limit(1);
      
      if (testError && !testError.message.includes('relation "users" does not exist')) {
        throw new Error(`Erro de conexão: ${testError.message}`);
      }

      // Save to localStorage for persistence
      localStorage.setItem('supabase_url', credentials.url);
      localStorage.setItem('supabase_anon_key', credentials.anonKey);
      
      // Reload the page to reinitialize Supabase
      window.location.reload();
      
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsConnecting(false);
    }
  };

              <div className="mt-6 p-4 bg-green-100 rounded-xl border border-green-300">
                <p className="text-green-800 font-bold text-sm">
                  ⚠️ IMPORTANTE: Após configurar, TODOS os sócios poderão acessar os mesmos dados de qualquer dispositivo!
                </p>
              </div>
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
                Agora você precisa copiar as credenciais do seu projeto Supabase para conectar TODOS os dados.
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Configurar Banco de Dados</h2>
              <p className="text-slate-600">Configure o Supabase para sincronizar dados entre dispositivos</p>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Passo 1: Criar Conta no Supabase</h3>
                <p className="text-blue-700 mb-4">
                  O Supabase é um banco de dados gratuito que permitirá sincronizar seus dados entre todos os dispositivos.
                </p>
              <div className="mt-6 p-4 bg-purple-100 rounded-xl border border-purple-300">
                <p className="text-purple-800 font-bold text-sm">
                  🔐 SEGURANÇA: Compartilhe essas credenciais apenas com os sócios autorizados!
                </p>
              </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-blue-800">Gratuito para até 50.000 linhas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-blue-800">Backup automático na nuvem</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-blue-800">Acesso de qualquer dispositivo</span>
                  </div>
                </div>
                <div className="mt-6">
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Criar Conta no Supabase (Gratuito)
                  </a>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <h3 className="text-xl font-bold text-green-900 mb-4">Instruções Detalhadas:</h3>
                <ol className="space-y-3 text-green-800">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <span>Clique no link acima para acessar o Supabase</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <span>Crie uma conta gratuita (pode usar Google/GitHub)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <span>Clique em "New Project" e escolha um nome (ex: "revgold-sistema")</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    <span>Defina uma senha para o banco (anote ela!)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                    <span>Aguarde o projeto ser criado (1-2 minutos)</span>
                  </li>
                </ol>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary"
                >
                  Já criei a conta, continuar
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200">
                <h3 className="text-xl font-bold text-purple-900 mb-4">Passo 2: Obter Credenciais</h3>
                <p className="text-purple-700 mb-4">
                  Agora você precisa copiar as credenciais do seu projeto Supabase.
                </p>
                <ol className="space-y-3 text-purple-800">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <span>No painel do Supabase, vá em <strong>"Settings" → "API"</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <span>Copie a <strong>"Project URL"</strong> (algo como: https://xxx.supabase.co)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <span>Copie a <strong>"anon public"</strong> key (chave longa que começa com "eyJ")</span>
                  </li>
                </ol>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Project URL *
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={credentials.url}
                      onChange={(e) => setCredentials(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-slate-700 pr-12"
                      placeholder="https://seu-projeto.supabase.co"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(credentials.url)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title="Copiar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Anon Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={credentials.anonKey}
                      onChange={(e) => setCredentials(prev => ({ ...prev, anonKey: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-slate-700 pr-20"
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-3">✅ Após Conectar:</h3>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>• Todos os dados serão salvos automaticamente no Supabase</li>
                <li>• Qualquer sócio pode acessar de qualquer dispositivo</li>
                <li>• Dados são sincronizados em tempo real</li>
                <li>• Backup automático na nuvem</li>
                <li>• Histórico completo preservado</li>
              </ul>
            </div>
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="text-slate-400 hover:text-slate-600"
                        title={showKey ? "Ocultar" : "Mostrar"}
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(credentials.anonKey)}
                        className="text-slate-400 hover:text-slate-600"
                        title="Copiar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || !credentials.url || !credentials.anonKey}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Conectando...' : 'Conectar ao Banco'}
                {isConnecting ? 'Conectando e Sincronizando...' : 'Conectar e Sincronizar Tudo'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}