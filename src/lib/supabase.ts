import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client only if environment variables are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => Boolean(supabase);

// Upload de imagem para o bucket de cheques
export const uploadCheckImage = async (file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar o upload de imagens.');
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${checkId}_${imageType}.${fileExt}`;
    const filePath = `checks/${fileName}`;

    const { data, error } = await supabase.storage
      .from('check-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Retorna a URL pública da imagem
    const { data: { publicUrl } } = supabase.storage
      .from('check-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw error;
  }
};

// Deletar imagem do bucket
export const deleteCheckImage = async (imagePath: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase não está configurado.');
  }

  try {
    const path = imagePath.replace(`${supabaseUrl}/storage/v1/object/public/check-images/`, '');
    
    const { error } = await supabase.storage
      .from('check-images')
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    throw error;
  }
};

// Função para obter URL pública de uma imagem
export const getCheckImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  if (!supabase) {
    return ''; // Return empty string if Supabase is not configured
  }
  
  // Se já é uma URL completa, retorna como está
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Se é apenas o caminho, constrói a URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('check-images')
    .getPublicUrl(imagePath);
    
  return publicUrl;
};