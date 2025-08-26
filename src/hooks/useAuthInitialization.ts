import { useEffect, useState } from 'react';
import { ensureAuthenticated } from '../lib/supabase';

export function useAuthInitialization() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasSupabaseConnection, setHasSupabaseConnection] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticação automática...');
        const user = await ensureAuthenticated();
        setHasSupabaseConnection(!!user);
        setIsInitialized(true);
        console.log('✅ Autenticação inicializada');
      } catch (error) {
        console.warn('Authentication initialization failed:', error);
        setHasSupabaseConnection(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  return { isInitialized, hasSupabaseConnection };
}