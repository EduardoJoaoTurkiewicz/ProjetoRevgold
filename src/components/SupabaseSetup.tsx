import React, { useState } from 'react';
import { X, Database, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface SupabaseSetupProps {
  onClose: () => void;
  onConfigured: () => void;
}

export function SupabaseSetup({ onClose, onConfigured }: SupabaseSetupProps) {
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState({
    url: '',
    anonKey: ''
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateCredentials = async () => {
    if (!credentials.url || !credentials.anonKey) {
      setValidationError('Por favor, preencha todos os campos obrigatórios.');
      return false;
    }

    if (!credentials.url.includes('supabase.co')) {
      setValidationError('URL do Supabase inválida. Deve conter "supabase.co".');
      return false;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Test connection
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(credentials.url, credentials.anonKey);
      
      // Try to make a simple query to test connection
      const { error } = await testClient.from('users').select('count').limit(1);
      
      if (error && !error.message.includes('relation "users" does not exist')) {
        throw new Error(`Erro de conexão: ${error.message}`);
      }

      // Save credentials to localStorage
      localStorage.setItem('supabase_url', credentials.url);
      localStorage.setItem('supabase_anon_key', credentials.anonKey);

      console.log('✅ Credenciais do Supabase validadas e salvas');
      return true;
    } catch (error) {
      console.error('❌ Erro na validação:', error);
      setValidationError(
        error instanceof Error 
          ? `Erro de validação: ${error.message}` 
          : 'Erro desconhecido ao validar credenciais.'
      );
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleNext = async () => {
    if (step === 2) {
      const isValid = await validateCredentials();
      if (isValid) {
        setStep(3);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    onConfigured();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center modern-shadow-lg">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Configurar Supabase</h2>
                <p className="text-slate-600">Conecte seu banco de dados para sincronização em tempo real</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
                    ${step >= stepNumber 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg' 
                      : 'bg-slate-200 text-slate-500'
                    }
                  `}>
                    {step > stepNumber ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-16 h-1 rounded-full transition-all duration-300 ${
                      step > stepNumber ? 'bg-green-500' : 'bg-slate-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Passo 1: Criar Projeto no Supabase</h3>
                <p className="text-slate-600 text-lg mb-8">
                  Primeiro, você precisa criar um projeto gratuito no Supabase
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-4 text-lg">📋 Instruções:</h4>
                    <ol className="space-y-3 text-blue-800">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                        <span>Acesse <strong>supabase.com</strong> e clique em "Start your project"</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                        <span>Faça login com GitHub, Google ou email</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                        <span>Clique em "New Project"</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                        <span>Escolha um nome (ex: "revgold-sistema")</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</span>
                        <span>Defina uma senha forte para o banco</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">6</span>
                        <span>Selecione a região mais próxima</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">7</span>
                        <span>Clique em "Create new project"</span>
                      </li>
                    </ol>
                  </div>

                  <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
                    <h4 className="font-bold text-green-900 mb-3 text-lg">✅ Importante:</h4>
                    <ul className="space-y-2 text-green-800">
                      <li>• O plano gratuito é suficiente para começar</li>
                      <li>• Aguarde alguns minutos para o projeto ser criado</li>
                      <li>• Anote a senha do banco de dados</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white">
                    <h4 className="font-bold mb-4 text-lg">🚀 Por que Supabase?</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                        <span>Banco de dados PostgreSQL gratuito</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                        <span>Sincronização em tempo real</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                        <span>Backup automático dos dados</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                        <span>Acesso de qualquer dispositivo</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                        <span>Armazenamento de imagens</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 text-center font-bold text-lg shadow-lg hover:shadow-xl"
                  >
                    <ExternalLink className="w-6 h-6 mx-auto mb-2" />
                    Abrir Supabase.com
                  </a>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Passo 2: Configurar Credenciais</h3>
                <p className="text-slate-600 text-lg mb-8">
                  Copie as credenciais do seu projeto Supabase
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                    <h4 className="font-bold text-yellow-900 mb-4 text-lg">📍 Onde encontrar:</h4>
                    <ol className="space-y-3 text-yellow-800">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                        <span>No painel do Supabase, vá em <strong>"Settings"</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                        <span>Clique em <strong>"API"</strong> no menu lateral</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                        <span>Copie a <strong>"Project URL"</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                        <span>Copie a <strong>"anon public"</strong> key</span>
                      </li>
                    </ol>
                  </div>

                  <div className="p-6 bg-red-50 rounded-2xl border border-red-200">
                    <h4 className="font-bold text-red-900 mb-3 text-lg">⚠️ Importante:</h4>
                    <ul className="space-y-2 text-red-800">
                      <li>• Use apenas a chave <strong>"anon public"</strong></li>
                      <li>• NUNCA use a "service_role" key aqui</li>
                      <li>• Mantenha suas credenciais seguras</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Project URL *</label>
                    <input
                      type="url"
                      value={credentials.url}
                      onChange={(e) => setCredentials(prev => ({ ...prev, url: e.target.value.trim() }))}
                      className="input-field"
                      placeholder="https://seu-projeto.supabase.co"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Exemplo: https://abcdefghijklmnop.supabase.co
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Anon Public Key *</label>
                    <textarea
                      value={credentials.anonKey}
                      onChange={(e) => setCredentials(prev => ({ ...prev, anonKey: e.target.value.trim() }))}
                      className="input-field"
                      rows={4}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      required
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Chave pública que começa com "eyJ..."
                    </p>
                  </div>

                  {validationError && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-red-800 font-medium">{validationError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">🎉 Configuração Concluída!</h3>
                <p className="text-slate-600 text-lg mb-8">
                  Seu sistema RevGold está agora conectado ao Supabase
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
                  <h4 className="font-bold text-green-900 mb-4 text-lg">✅ O que foi configurado:</h4>
                  <ul className="space-y-3 text-green-800">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>Conexão com banco de dados PostgreSQL</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>Sincronização em tempo real</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>Armazenamento de imagens</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>Backup automático dos dados</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-4 text-lg">🚀 Próximos passos:</h4>
                  <ul className="space-y-3 text-blue-800">
                    <li className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                      <span>O sistema será recarregado</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                      <span>Dados locais serão migrados</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                      <span>Todos os usuários verão os mesmos dados</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                      <span>Sistema funcionará em qualquer dispositivo</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-8 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl border-2 border-green-300 text-center">
                <h4 className="text-2xl font-bold text-green-900 mb-4">
                  🎯 Sistema Totalmente Sincronizado!
                </h4>
                <p className="text-green-700 font-semibold text-lg">
                  Agora todos os sócios podem acessar os mesmos dados de qualquer lugar!
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              Passo {step} de 3
            </div>
            
            <div className="flex gap-4">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary"
                  disabled={isValidating}
                >
                  Voltar
                </button>
              )}
              
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={isValidating || (step === 2 && (!credentials.url || !credentials.anonKey))}
                  className="btn-primary flex items-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      Próximo
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
                >
                  <CheckCircle className="w-6 h-6" />
                  Finalizar Configuração
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}