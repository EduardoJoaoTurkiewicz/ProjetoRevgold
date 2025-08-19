import React, { useState } from 'react';
import { Database, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { reinitializeSupabase } from '../lib/supabase';

interface SupabaseSetupProps {
  onClose: () => void;
  onConfigured: () => void;
}

export function SupabaseSetup({ onClose, onConfigured }: SupabaseSetupProps) {
  const [formData, setFormData] = useState({
    url: localStorage.getItem('supabase_url') || '',
    anonKey: localStorage.getItem('supabase_anon_key') || ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConnecting(true);

    try {
      // Validate inputs
      if (!formData.url || !formData.anonKey) {
        throw new Error('Por favor, preencha todos os campos obrigatórios.');
      }

      if (!formData.url.includes('supabase.co')) {
        throw new Error('URL do projeto deve ser uma URL válida do Supabase (ex: https://xxx.supabase.co)');
      }

      // Test connection by reinitializing
      reinitializeSupabase(formData.url, formData.anonKey);
      
      // Give a moment for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Supabase configurado com sucesso');
      onConfigured();
      
    } catch (error) {
      console.error('❌ Erro ao configurar Supabase:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao conectar');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Conectar ao Supabase</h2>
                <p className="text-slate-600">Configure a conexão com o banco de dados</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800 font-medium">Erro na conexão</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Como obter as credenciais do Supabase</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                <p>Acesse <a href="https://supabase.com" target="_blank" className="text-blue-600 underline font-semibold">supabase.com</a> e faça login</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                <p>Crie um novo projeto ou selecione um existente</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                <p>Vá em <strong>Settings → API</strong> e copie a <strong>Project URL</strong> e <strong>anon/public key</strong></p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Project URL *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="input-field"
                placeholder="https://xxxxxxxxxxxxx.supabase.co"
                required
                disabled={isConnecting}
              />
              <p className="text-xs text-slate-500 mt-1">
                URL do seu projeto Supabase (encontrada em Settings → API)
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Anon Key *</label>
              <textarea
                value={formData.anonKey}
                onChange={(e) => setFormData(prev => ({ ...prev, anonKey: e.target.value }))}
                className="input-field"
                rows={4}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                required
                disabled={isConnecting}
              />
              <p className="text-xs text-slate-500 mt-1">
                Chave pública do seu projeto (anon/public key em Settings → API)
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-800 font-medium">Segurança</p>
                  <p className="text-xs text-green-700 mt-1">
                    Suas credenciais são armazenadas localmente no navegador e nunca são enviadas para terceiros.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isConnecting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={isConnecting || !formData.url || !formData.anonKey}
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Conectando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar e Conectar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}