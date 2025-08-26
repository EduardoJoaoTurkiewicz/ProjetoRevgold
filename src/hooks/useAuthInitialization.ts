import { useEffect } from 'react';
import { ensureAuthenticated } from '../lib/supabase';

export function useAuthInitialization() {
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticação automática...');
        await ensureAuthenticated();
        console.log('✅ Autenticação inicializada');
      } catch (error) {
        console.log('⚠️ Erro na inicialização da autenticação:', error);
      }
    };

    initializeAuth();
  }, []);
}