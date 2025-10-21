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
    // Primeiro, testar se a URL do Supabase está acessível
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Testar com uma query simples na tabela employees
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      console.error('Erro ao conectar ao Supabase:', error.message);

      // Verificar tipos específicos de erro
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Não foi possível conectar ao servidor Supabase. Verifique sua conexão de internet.'
        };
      }

      if (error.message.includes('JWT') || error.message.includes('auth')) {
        return {
          success: false,
          error: 'Erro de autenticação. Verifique suas credenciais no arquivo .env.'
        };
      }

      return {
        success: false,
        error: `Erro: ${error.message}`
      };
    }

    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return { success: true };

  } catch (error: any) {
    console.error('Exceção ao testar conexão:', error);

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Timeout: O servidor não respondeu em 8 segundos. Verifique sua conexão.'
      };
    }

    if (error.message?.includes('fetch') || error.message?.includes('NetworkError')) {
      return {
        success: false,
        error: 'Erro de rede. Verifique sua conexão com a internet.'
      };
    }

    return {
      success: false,
      error: error.message || 'Erro desconhecido ao conectar'
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