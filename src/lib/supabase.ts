import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Verificar se o Supabase está configurado
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isConfigured = !!(
    url && 
    key && 
    url !== 'https://your-project-id.supabase.co' &&
    url !== 'https://placeholder.supabase.co' &&
    key !== 'your-anon-key-here' &&
    url.length > 10 && 
    key.length > 10
  );
  
  if (!isConfigured) {
    // Apenas mostrar instruções uma vez
    if (!window.supabaseWarningShown) {
      console.warn('⚠️ Supabase não configurado - sistema funcionará em modo offline');
      console.log('📝 Para conectar ao Supabase:');
      console.log('1. Crie um novo projeto em https://supabase.com/dashboard');
      console.log('2. Configure VITE_SUPABASE_URL no arquivo .env');
      console.log('3. Configure VITE_SUPABASE_ANON_KEY no arquivo .env');
      console.log('4. Execute as migrações: npx supabase db push');
      console.log('5. Reinicie o servidor de desenvolvimento');
      window.supabaseWarningShown = true;
    }
  }
  
  return isConfigured;
}

// Criar cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Função para testar conexão
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { 
      success: false, 
      error: 'Supabase não configurado. Configure o arquivo .env com suas credenciais.' 
    };
  }
  
  try {
    // Apenas log detalhado em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Testando conexão com Supabase...');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      // Silenciar erros repetitivos de conexão
      return { 
        success: false, 
        error: `Conexão indisponível. Tentando reconectar...` 
      };
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Conexão com Supabase estabelecida');
    }
    return { success: true };
    
  } catch (error) {
    // Silenciar erros de timeout e conexão
    
    if (error.name === 'AbortError') {
      return { 
        success: false, 
        error: 'Timeout na conexão. Tentando reconectar...' 
      };
    }
    
    return { 
      success: false, 
      error: `Reconectando...` 
    };
  }
}

// Função para verificar saúde do sistema
export async function healthCheck(): Promise<{ healthy: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { healthy: false, error: 'Supabase não configurado' };
    }

    const { error } = await supabase
      .from('cash_balances')
      .select('id')
      .limit(1);
    
    if (error) {
      return { healthy: false, error: error.message };
    }
    
    return { healthy: true };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message || 'Erro desconhecido' 
    };
  }
}