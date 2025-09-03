import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isConfigured = !!(
    url && 
    key && 
    url !== 'https://your-project-id.supabase.co' && 
    key !== 'your-anon-key-here' &&
    url.length > 10 && 
    key.length > 10
  );
  
  if (!isConfigured) {
    console.error('❌ SUPABASE NÃO CONFIGURADO CORRETAMENTE');
    console.error('📝 Para corrigir este erro:');
    console.error('1. Crie um arquivo .env na raiz do projeto');
    console.error('2. Adicione suas credenciais do Supabase:');
    console.error('   VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co');
    console.error('   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui');
    console.error('3. Reinicie o servidor de desenvolvimento');
    console.error('🔗 URL atual:', url || 'não definida');
    console.error('🔑 Key atual:', key ? `${key.substring(0, 10)}...` : 'não definida');
  }
  
  return isConfigured;
}

// Create client with proper error handling
export const supabase = (() => {
  if (!isSupabaseConfigured()) {
    console.error('❌ Criando cliente Supabase com valores placeholder devido à configuração incorreta');
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key');
  }
  
  console.log('✅ Supabase configurado corretamente, criando cliente...');
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
})();

// Test connection function
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    console.log('❌ Supabase não configurado');
    return false;
  }
  
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    // Test with a simple query and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    // Test with cash_balances table first
    const { data: balanceData, error: balanceError } = await supabase
      .from('cash_balances')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (balanceError) {
      if (balanceError.message?.includes('Failed to fetch') || balanceError.message?.includes('fetch')) {
        throw new Error('Erro de conexão: Não foi possível conectar ao Supabase. Verifique sua conexão com a internet.');
      }
      console.warn('Tabela cash_balances não encontrada, testando com employees...');
      
      // Fallback test with employees table
      const { data, error } = await supabase
        .from('employees')
        .select('id')
        .limit(1);
      
      if (error) {
        throw new Error(`Erro de conexão: ${error.message}`);
      }
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Timeout na conexão com Supabase');
    } else {
      console.error('❌ Erro na conexão com Supabase:', error);
    }
    return false;
  }
}

// Health check function
export async function healthCheck() {
  try {
    console.log('🔍 Iniciando verificação de saúde do Supabase...');
    
    if (!isSupabaseConfigured()) {
      return {
        configured: false,
        connected: false,
        error: 'Supabase não está configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env'
      };
    }

    // Test connection with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Erro de conexão: Não foi possível conectar ao Supabase. Verifique sua conexão com a internet e as credenciais do Supabase.');
      }
      throw new Error(`Erro de conexão: ${error.message}`);
    }
    
    return {
      configured: true,
      connected: true
    };
    
  } catch (error) {
    let errorMessage = 'Erro desconhecido na conexão';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout na conexão com Supabase. Verifique sua conexão com a internet.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    console.error('❌ Erro na verificação de saúde:', errorMessage);
    return {
      configured: false,
      connected: false,
      error: errorMessage
    };
  }
}
