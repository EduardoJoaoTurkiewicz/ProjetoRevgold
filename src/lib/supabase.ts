import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('employees').select('count').single();
    if (error) throw error;
    console.log('✅ Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com Supabase:', error);
    return false;
  }
}

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isConfigured = !!(
    url && 
    key && 
    url !== 'https://your-project-id.supabase.co' && 
    key !== 'your-anon-key-here' &&
    url.includes('supabase.co')
  );
  
  console.log('🔍 Verificação do Supabase:', {
    url: url ? '✅ Configurada' : '❌ Não configurada',
    key: key ? '✅ Configurada' : '❌ Não configurada',
    isValid: isConfigured ? '✅ Válida' : '❌ Inválida'
  });
  
  return isConfigured;
}

// Image handling functions for check images
export async function uploadCheckImage(file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${checkId}-${imageType}-${Date.now()}.${fileExt}`;
  const filePath = `check-images/${fileName}`;

  const { error } = await supabase.storage
    .from('check-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Erro no upload:', error);
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }

  console.log('✅ Upload realizado com sucesso:', filePath);
  return filePath;
}

export async function deleteCheckImage(filePath: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente.');
  }

  const { error } = await supabase.storage
    .from('check-images')
    .remove([filePath]);

  if (error) {
    console.error('Erro ao deletar imagem:', error);
    throw new Error(`Erro ao deletar imagem: ${error.message}`);
  }

  console.log('✅ Imagem deletada com sucesso:', filePath);
}

export function getCheckImageUrl(filePath: string): string {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado, retornando URL de fallback');
    return '/logo-fallback.svg';
  }

  const { data } = supabase.storage
    .from('check-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Database utility functions
export async function executeQuery(query: string, params?: any[]) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { 
      query, 
      params: params || [] 
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
}

// Health check function
export async function healthCheck() {
  try {
    console.log('🔍 Iniciando verificação de saúde do Supabase...');
    
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não está configurado');
    }

    // Test basic connection
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.warn('⚠️ Aviso de autenticação:', authError.message);
    }

    // Test database access
    const tables = ['employees', 'sales', 'debts', 'checks', 'boletos', 'cash_balances', 'cash_transactions', 'pix_fees'];
    const results = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          results[table] = `❌ Erro: ${error.message}`;
        } else {
          results[table] = `✅ ${count || 0} registros`;
        }
      } catch (error) {
        results[table] = `❌ Erro: ${error.message}`;
      }
    }

    console.log('📊 Status das tabelas:', results);
    
    return {
      configured: true,
      connected: true,
      tables: results
    };
    
  } catch (error) {
    console.error('❌ Erro na verificação de saúde:', error);
    return {
      configured: false,
      connected: false,
      error: error.message
    };
  }
}