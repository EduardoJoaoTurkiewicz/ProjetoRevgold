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
    console.warn('⚠️ Supabase não configurado - sistema funcionará em modo offline');
    console.log('📝 Para conectar ao Supabase:');
    console.log('1. Crie um novo projeto em https://supabase.com/dashboard');
    console.log('2. Configure VITE_SUPABASE_URL no arquivo .env');
    console.log('3. Configure VITE_SUPABASE_ANON_KEY no arquivo .env');
    console.log('4. Execute as migrações: npx supabase db push');
    console.log('5. Reinicie o servidor de desenvolvimento');
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
    console.log('🔍 Testando conexão com Supabase...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return { 
        success: false, 
        error: `Erro de conexão: ${error.message}. Verifique suas credenciais do Supabase.` 
      };
    }
    
    console.log('✅ Conexão com Supabase estabelecida');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Falha na conexão:', error);
    
    if (error.name === 'AbortError') {
      return { 
        success: false, 
        error: 'Timeout na conexão. Verifique sua internet e se o projeto Supabase está ativo.' 
      };
    }
    
    return { 
      success: false, 
      error: `Erro de conexão: ${error.message || error}` 
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