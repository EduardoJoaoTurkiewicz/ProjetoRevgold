import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { ErrorHandler } from './errorHandler';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gzazwmgiptnswkaljqhy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is properly configured
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
    ErrorHandler.logProjectError('SUPABASE NÃO CONFIGURADO CORRETAMENTE', 'Configuration Check');
    console.group('📝 Para corrigir este erro:');
    console.log('1. Abra o arquivo .env na raiz do projeto');
    console.log('2. Configure VITE_SUPABASE_URL=https://gzazwmgiptnswkaljqhy.supabase.co');
    console.log('3. Configure VITE_SUPABASE_ANON_KEY com a chave anônima do seu projeto');
    console.log('4. Reinicie o servidor de desenvolvimento (npm run dev)');
    console.log('🔗 URL atual:', url || 'não definida');
    console.log('🔑 Key atual:', key ? `${key.substring(0, 10)}...` : 'não definida');
    console.groupEnd();
    
    // Show user-friendly error in the browser
    if (typeof window !== 'undefined') {
      const errorMessage = `
ERRO DE CONFIGURAÇÃO DO SUPABASE

Para corrigir este erro:

1. Abra o arquivo .env na raiz do projeto
2. Configure suas credenciais do Supabase:
   - VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
   - VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
3. Reinicie o servidor (npm run dev)

Encontre suas credenciais em:
https://supabase.com/dashboard → Seu Projeto → Settings → API
      `;
      
      setTimeout(() => {
        alert(errorMessage);
      }, 1000);
    }
  }
  
  return isConfigured;
}

// Create client with proper error handling
export const supabase = (() => {
  if (!isSupabaseConfigured()) {
    ErrorHandler.logProjectError('Criando cliente Supabase com valores placeholder devido à configuração incorreta', 'Client Creation');
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
      ErrorHandler.logProjectError(error, 'Supabase Connection Test');
    }
    return false;
  }
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    // Check if environment variables are available
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Variáveis de ambiente do Supabase não encontradas. Executando em modo offline.');
      return false;
    }

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
      .from('users')
      .select('count')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        throw new Error('Erro de conexão: Não foi possível conectar ao Supabase. Verifique sua conexão com a internet e as credenciais do Supabase.');
      }
      throw new Error(`Erro de conexão: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.warn('⚠️ Falha na verificação de saúde do Supabase. Executando em modo offline.', error);
    return false;
  }
}