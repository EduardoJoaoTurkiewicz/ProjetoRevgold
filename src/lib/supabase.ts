import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if environment variables are properly configured
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Test connection function
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    console.log('❌ Supabase não configurado');
    return false;
  }
  
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
    url.length > 10 && 
    key.length > 10
  );
  
  if (!isConfigured) {
    console.log('⚠️ Supabase não está configurado corretamente. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  }
  
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

// Service objects for automation
export const checksService = {
  async create(checkData: any) {
    if (!isSupabaseConfigured()) {
      // Return mock data for local development
      return {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
    }
    const { data, error } = await supabase.from('checks').insert([checkData]).select().single();
    if (error) throw error;
    return data;
  },
  
  async update(id: string, checkData: any) {
    if (!isSupabaseConfigured()) {
      return; // No-op for local development
    }
    const { error } = await supabase.from('checks').update(checkData).eq('id', id);
    if (error) throw error;
  },
  
  async delete(id: string) {
    if (!isSupabaseConfigured()) {
      return; // No-op for local development
    }
    const { error } = await supabase.from('checks').delete().eq('id', id);
    if (error) throw error;
  }
};

export const boletosService = {
  async create(boletoData: any) {
    if (!isSupabaseConfigured()) {
      // Return mock data for local development
      return {
        ...boletoData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
    }
    const { data, error } = await supabase.from('boletos').insert([boletoData]).select().single();
    if (error) throw error;
    return data;
  },
  
  async update(id: string, boletoData: any) {
    if (!isSupabaseConfigured()) {
      return; // No-op for local development
    }
    const { error } = await supabase.from('boletos').update(boletoData).eq('id', id);
    if (error) throw error;
  },
  
  async delete(id: string) {
    if (!isSupabaseConfigured()) {
      return; // No-op for local development
    }
    const { error } = await supabase.from('boletos').delete().eq('id', id);
    if (error) throw error;
  }
};

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
    const { data, error } = await supabase.from('employees').select('count').limit(1);
    
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
      error: error.message || 'Erro desconhecido na conexão'
    };
  }
}

export const ensureAuthenticated = async () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado.');
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.warn('Falha na autenticação Supabase:', error);
    return null;
  }
};