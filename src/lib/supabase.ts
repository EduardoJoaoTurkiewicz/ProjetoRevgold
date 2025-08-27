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
    console.log('⚠️ Supabase não está configurado corretamente. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  }
  
  return isConfigured;
}

// Only create client if environment variables are properly configured
export const supabase = isSupabaseConfigured() 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder-key');

// Test connection function
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    console.log('❌ Supabase não configurado');
    return false;
  }
  
  try {
    const { data, error } = await supabase.from('employees').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error);
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

    // Teste simples de conexão
    const { data, error } = await supabase.from('employees').select('id').limit(1);
    
    if (error) {
      throw new Error(`Erro de conexão: ${error.message}`);
    }
    
    return {
      configured: true,
      connected: true
    };
    
  } catch (error) {
    console.error('❌ Erro na verificação de saúde:', error);
    return {
      configured: false,
      connected: false,
      error: (error as Error).message || 'Erro desconhecido na conexão'
    };
  }
}
