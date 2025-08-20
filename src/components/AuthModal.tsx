import React, { useState } from 'react';
import { X, LogIn, UserPlus, Database, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../lib/supabase';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Por favor, preencha todos os campos.');
      }

      if (formData.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
      }

      let result;
      if (mode === 'signin') {
        result = await signInWithEmail(formData.email, formData.password);
      } else {
        result = await signUpWithEmail(formData.email, formData.password);
      }

      if (result.success) {
        setSuccess(mode === 'signin' ? 'Login realizado com sucesso!' : 'Conta criada com sucesso!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro na autenticação:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {mode === 'signin' ? 'Fazer Login' : 'Criar Conta'}
                </h2>
                <p className="text-slate-600">Para salvar dados no banco</p>
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
                  <p className="text-sm text-red-800 font-medium">Erro</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-800 font-medium">{success}</p>
                  <p className="text-xs text-green-700 mt-1">Redirecionando...</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Salvar dados no banco</p>
                <p className="text-xs text-blue-700 mt-1">
                  Faça login para que todos os dados sejam salvos permanentemente no Supabase
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
                placeholder="seu@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="input-field"
                placeholder="Mínimo 6 caracteres"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                className="btn-primary flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {mode === 'signin' ? 'Entrando...' : 'Criando conta...'}
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {mode === 'signin' ? 'Entrar' : 'Criar Conta'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="btn-secondary"
                disabled={isLoading}
              >
                {mode === 'signin' ? 'Não tem conta? Criar uma' : 'Já tem conta? Fazer login'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                disabled={isLoading}
              >
                Continuar sem login (dados apenas locais)
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Importante</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Sem login, os dados ficam apenas no seu navegador e podem ser perdidos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}