import { useEffect } from 'react';
import { ensureAuthenticated } from '../lib/supabase';

  const [hasSupabaseConnection, setHasSupabaseConnection] = useState(false);
export function useAuthInitialization() {
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticação automática...');
        const user = await ensureAuthenticated();
        setHasSupabaseConnection(!!user);
        console.log('✅ Autenticação inicializada');
      } catch (error) {
        console.warn('Authentication initialization failed:', error);
        setHasSupabaseConnection(false);
      }
    };

    initializeAuth();
  }, []);
}
  return { isInitialized, hasSupabaseConnection };