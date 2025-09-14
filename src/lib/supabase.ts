import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { ErrorHandler } from './errorHandler';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Enhanced logging for debugging
console.log('🔧 Supabase Configuration Check:');
console.log('📍 URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET');
console.log('🔑 Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');

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
    console.error('❌ SUPABASE CONFIGURATION ERROR:');
    console.error('📍 Current URL:', url || 'undefined');
    console.error('🔑 Current Key:', key ? `${key.substring(0, 20)}...` : 'undefined');
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
    console.warn('⚠️ Creating placeholder Supabase client due to configuration issues');
    ErrorHandler.logProjectError('Criando cliente Supabase com valores placeholder devido à configuração incorreta', 'Client Creation');
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key');
  }
  
  console.log('✅ Supabase configurado corretamente, criando cliente...');
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
})();

// Test connection function
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
  if (!isSupabaseConfigured()) {
    const error = 'Supabase não configurado corretamente';
    console.error('❌', error);
    return { success: false, error };
  }
  
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test with a simple query and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    // Test with cash_balances table first (most likely to exist)
    const { data: balanceData, error: balanceError } = await supabase
      .from('cash_balances')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (balanceError) {
      console.warn('⚠️ cash_balances table test failed:', balanceError.message);
      
      if (balanceError.message?.includes('Failed to fetch') || balanceError.message?.includes('fetch')) {
        const error = 'Erro de conexão: Não foi possível conectar ao Supabase. Verifique sua conexão com a internet.';
        console.error('❌ Network error:', error);
        return { success: false, error, details: balanceError };
      }
      
      console.log('🔄 cash_balances table not found, testing with employees table...');
      
      // Fallback test with employees table
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('id')
        .limit(1);
      
      if (empError) {
        console.error('❌ employees table test also failed:', empError.message);
        
        // Try one more table - sales
        console.log('🔄 employees table failed, testing with sales table...');
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('id')
          .limit(1);
        
        if (salesError) {
          const error = `Erro de conexão com todas as tabelas testadas: ${salesError.message}`;
          console.error('❌ All table tests failed:', error);
          return { 
            success: false, 
            error, 
            details: { 
              cashBalanceError: balanceError, 
              employeesError: empError, 
              salesError 
            } 
          };
        }
        
        console.log('✅ sales table accessible, connection verified');
      } else {
        console.log('✅ employees table accessible, connection verified');
      }
    } else {
      console.log('✅ cash_balances table accessible, connection verified');
    }
    
    console.log('✅ Supabase connection established successfully');
    return { success: true };
  } catch (error) {
    let errorMessage = 'Erro desconhecido na conexão';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout na conexão com Supabase (5s)';
      console.error('❌', errorMessage);
    } else {
      errorMessage = `Erro na conexão com Supabase: ${error.message || error}`;
      console.error('❌', errorMessage, error);
      ErrorHandler.logProjectError(error, 'Supabase Connection Test');
    }
    
    return { success: false, error: errorMessage, details: error };
  }
}

// Health check function
export async function healthCheck(): Promise<{ healthy: boolean; error?: string; details?: any }> {
  try {
    if (!isSupabaseConfigured()) {
      const error = 'Supabase not configured properly';
      console.warn('⚠️', error);
      return { healthy: false, error };
    }

    console.log('🔍 Running Supabase health check...');

    // Test connection with a simple query and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const { error } = await supabase
      .from('sales')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      const errorMessage = `Supabase health check failed: ${error.message}`;
      console.warn('⚠️', errorMessage);
      return { healthy: false, error: errorMessage, details: error };
    }
    
    console.log('✅ Supabase health check passed');
    return { healthy: true };
  } catch (error) {
    let errorMessage = 'Health check error';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Supabase health check timeout';
      console.warn('⚠️', errorMessage);
    } else {
      errorMessage = `Supabase health check failed: ${error.message || error}`;
      console.warn('⚠️', errorMessage, error);
    }
    
    return { healthy: false, error: errorMessage, details: error };
  }
}