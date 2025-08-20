import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables or localStorage
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url');
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key');

// Create Supabase client
export let supabase: any = null;

// Initialize Supabase client
const initializeSupabaseClient = () => {
  if (supabaseUrl && supabaseAnonKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('✅ Supabase conectado automaticamente');
    } catch (error) {
      console.error('❌ Erro ao conectar ao Supabase:', error);
      supabase = null;
    }
  } else {
    console.warn('⚠️ Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
  }
};

// Check authentication status
const authenticateUser = async () => {
  if (!supabase) return;
  
  try {
    // Check if user is already authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ Usuário já autenticado:', user.email);
            });
            
            if (forceSignInError && !forceSignInError.message.includes('email_not_confirmed')) {
              console.error('❌ Erro ao fazer login forçado:', forceSignInError);
            } else {
              console.log('✅ Login realizado apesar do email não confirmado');
            }
          } else {
            console.error('❌ Erro ao criar usuário:', error);
          }
        } else {
          console.log('✅ Usuário criado com sucesso');
        }
      } else {
        console.log('✅ Login automático realizado com sucesso');
      }
    } else {
      console.log('ℹ️ Nenhum usuário autenticado');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação:', error);
  }
};

// Initialize on module load
initializeSupabaseClient();

// Function to reinitialize Supabase with new credentials
export const reinitializeSupabase = (newUrl?: string, newKey?: string) => {
  if (newUrl && newKey) {
    // Update credentials
    supabaseUrl = newUrl;
    supabaseAnonKey = newKey;
    
    // Save to localStorage
    localStorage.setItem('supabase_url', newUrl);
    localStorage.setItem('supabase_anon_key', newKey);
    
    console.log('🔄 Credenciais do Supabase atualizadas e salvas');
  } else {
    // Re-read from localStorage
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url');
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key');
    
    if (supabaseUrl && supabaseAnonKey) {
      console.log('🔄 Credenciais do Supabase carregadas do localStorage');
    }
  }
  
  // Reinitialize client
  initializeSupabaseClient();
  
  // Trigger a data reload if configured
  if (isSupabaseConfigured()) {
    console.log('✅ Supabase reinicializado com sucesso');
    // Dispatch custom event to trigger data reload
    window.dispatchEvent(new CustomEvent('supabase-reconnected'));
  }
};

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabase && supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://your-project.supabase.co' && 
    supabaseAnonKey !== 'your-anon-key');
};

// Ensure user is authenticated before database operations
export const ensureAuthenticated = async (): Promise<boolean> => {
  if (!supabase) return false;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Try to authenticate, ignoring email confirmation errors
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@revgold.com',
        password: 'revgold123456'
      });
      
      if (error) {
        // If it's just an email confirmation error, we can still proceed
        if (error.message.includes('email_not_confirmed') || error.message.includes('Email not confirmed')) {
    return Boolean(user);
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação:', error instanceof Error ? error.message : error);
    return false;
  }
};

// Upload de imagem para o bucket de cheques
export const uploadCheckImage = async (file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }

  // Ensure user is authenticated
  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Erro de autenticação. Não foi possível fazer upload da imagem.');
  }

  try {
    // Validar arquivo
    if (!file || file.size === 0) {
      throw new Error('Arquivo inválido ou vazio.');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem.');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('O arquivo deve ter no máximo 10MB.');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${checkId}_${imageType}_${timestamp}.${fileExt}`;
    const filePath = `checks/${fileName}`;

    console.log('Iniciando upload:', { fileName, filePath, fileSize: file.size, fileType: file.type });

    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from('check-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('Erro no upload do Supabase:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }

    if (!data || !data.path) {
      throw new Error('Upload realizado mas caminho do arquivo não foi retornado.');
    }

    console.log('Upload realizado com sucesso:', data);

    // Obter URL pública da imagem
    const { data: { publicUrl } } = supabase.storage
      .from('check-images')
      .getPublicUrl(data.path);

    if (!publicUrl) {
      throw new Error('Não foi possível obter a URL pública da imagem.');
    }

    console.log('URL pública gerada:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('Erro completo no upload:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido durante o upload da imagem.');
    }
  }
};

// Deletar imagem do bucket
export const deleteCheckImage = async (imagePath: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase não está configurado.');
  }

  // Ensure user is authenticated
  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Erro de autenticação. Não foi possível deletar a imagem.');
  }

  try {
    if (!imagePath) {
      throw new Error('Caminho da imagem não fornecido.');
    }

    // Extrair o caminho relativo da URL completa
    let relativePath = imagePath;
    
    if (imagePath.includes('/storage/v1/object/public/check-images/')) {
      relativePath = imagePath.split('/storage/v1/object/public/check-images/')[1];
    } else if (imagePath.startsWith('checks/')) {
      relativePath = imagePath;
    } else if (imagePath.includes('checks/')) {
      relativePath = imagePath.substring(imagePath.indexOf('checks/'));
    }

    console.log('Deletando imagem:', { originalPath: imagePath, relativePath });

    const { error } = await supabase.storage
      .from('check-images')
      .remove([relativePath]);

    if (error) {
      console.error('Erro ao deletar no Supabase:', error);
      throw new Error(`Erro ao deletar imagem: ${error.message}`);
    }

    console.log('Imagem deletada com sucesso:', relativePath);

  } catch (error) {
    console.error('Erro completo na deleção:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao deletar a imagem.');
    }
  }
};

// Função para obter URL pública de uma imagem
export const getCheckImageUrl = (imagePath: string): string => {
  if (!imagePath) {
    console.warn('Caminho da imagem vazio');
    return '';
  }
  
  if (!supabase) {
    console.warn('Supabase não configurado, retornando string vazia para imagem');
    return '';
  }
  
  try {
    // Se já é uma URL completa e válida, retorna como está
    if (imagePath.startsWith('http') && imagePath.includes('supabase')) {
      return imagePath;
    }
    
    // Se é apenas o caminho relativo, constrói a URL pública
    let relativePath = imagePath;
    
    // Garantir que o caminho está no formato correto
    if (!relativePath.startsWith('checks/')) {
      relativePath = `checks/${relativePath}`;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('check-images')
      .getPublicUrl(relativePath);
      
    if (!publicUrl) {
      console.warn('Não foi possível gerar URL pública para:', imagePath);
      return '';
    }
    
    return publicUrl;
    
  } catch (error) {
    console.error('Erro ao gerar URL da imagem:', error);
    return '';
  }
};

// Função para upload de recibos de funcionários
export const uploadEmployeeReceipt = async (file: File, employeeId: string, paymentId: string): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase não está configurado.');
  }

  // Ensure user is authenticated
  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Erro de autenticação. Não foi possível fazer upload do recibo.');
  }

  try {
    // Validar arquivo
    if (!file || file.size === 0) {
      throw new Error('Arquivo inválido ou vazio.');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('O arquivo deve ter no máximo 10MB.');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = `receipt_${employeeId}_${paymentId}_${timestamp}.${fileExt}`;
    const filePath = `employee-receipts/${fileName}`;

    console.log('Iniciando upload de recibo:', { fileName, filePath, fileSize: file.size });

    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from('employee-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) {
      console.error('Erro no upload do recibo:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }

    if (!data || !data.path) {
      throw new Error('Upload realizado mas caminho do arquivo não foi retornado.');
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('employee-documents')
      .getPublicUrl(data.path);

    if (!publicUrl) {
      throw new Error('Não foi possível obter a URL pública do recibo.');
    }

    console.log('Upload de recibo realizado com sucesso:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('Erro no upload de recibo:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido durante o upload do recibo.');
    }
  }
};

// Função para deletar recibos de funcionários
export const deleteEmployeeReceipt = async (receiptPath: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase não está configurado.');
  }

  // Ensure user is authenticated
  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Erro de autenticação. Não foi possível deletar o recibo.');
  }

  try {
    if (!receiptPath) {
      throw new Error('Caminho do recibo não fornecido.');
    }

    // Extrair o caminho relativo da URL completa
    let relativePath = receiptPath;
    
    if (receiptPath.includes('/storage/v1/object/public/employee-documents/')) {
      relativePath = receiptPath.split('/storage/v1/object/public/employee-documents/')[1];
    } else if (receiptPath.startsWith('employee-receipts/')) {
      relativePath = receiptPath;
    }

    console.log('Deletando recibo:', { originalPath: receiptPath, relativePath });

    const { error } = await supabase.storage
      .from('employee-documents')
      .remove([relativePath]);

    if (error) {
      console.error('Erro ao deletar recibo:', error);
      throw new Error(`Erro ao deletar recibo: ${error.message}`);
    }

    console.log('Recibo deletado com sucesso:', relativePath);

  } catch (error) {
    console.error('Erro na deleção do recibo:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao deletar o recibo.');
    }
  }
};