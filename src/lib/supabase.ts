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

// Sistema de autenticação automática
let authPromise: Promise<boolean> | null = null;
let isAuthenticatedCache = false;
let lastAuthCheck = 0;
let defaultUser: any = null;

// Função para criar usuário padrão automaticamente
const createDefaultUser = async (): Promise<boolean> => {
  if (!supabase) return false;

  try {
    console.log('🔄 Criando usuário padrão para o sistema...');
    
    // Tentar fazer login primeiro
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@revgold.com',
      password: 'revgold123456'
    });

    if (signInData?.user && !signInError) {
      console.log('✅ Login realizado com usuário existente');
      defaultUser = signInData.user;
      return true;
    }

    // Se login falhou, tentar criar usuário
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@revgold.com',
      password: 'revgold123456',
      options: {
        emailRedirectTo: undefined,
        data: {
          username: 'Admin RevGold'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Erro ao criar usuário padrão:', signUpError.message);
      
      // Se erro de rate limit, tentar login novamente
      if (signUpError.message.includes('rate_limit') || signUpError.message.includes('email_send_rate_limit')) {
        console.log('⚠️ Rate limit detectado, tentando login...');
        const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
          email: 'admin@revgold.com',
          password: 'revgold123456'
        });

        if (retrySignIn?.user && !retryError) {
          console.log('✅ Login realizado após rate limit');
          defaultUser = retrySignIn.user;
          return true;
        }
      }
      
      return false;
    }

    if (signUpData?.user) {
      console.log('✅ Usuário padrão criado com sucesso');
      defaultUser = signUpData.user;
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Erro na criação do usuário padrão:', error);
    return false;
  }
};

export const ensureAuthenticated = async (): Promise<boolean> => {
  if (!supabase) {
    console.log('⚠️ Supabase não configurado - usando modo local');
    return false;
  }

  // Cache authentication check for 30 seconds to avoid rate limits
  const now = Date.now();
  if (isAuthenticatedCache && (now - lastAuthCheck) < 30000) {
    return true;
  }

  // Prevent multiple simultaneous auth attempts
  if (authPromise) {
    return authPromise;
  }

  authPromise = (async () => {
    try {
      // Check if already authenticated
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && !error) {
        console.log('✅ Usuário já autenticado:', user.email);
        defaultUser = user;
        isAuthenticatedCache = true;
        lastAuthCheck = now;
        return true;
      }

      // Try to authenticate with default user
      console.log('🔄 Tentando autenticação automática...');
      const authSuccess = await createDefaultUser();
      
      if (authSuccess) {
        isAuthenticatedCache = true;
        lastAuthCheck = now;
        return true;
      }

      console.log('⚠️ Não foi possível autenticar - usando modo local');
      isAuthenticatedCache = false;
      return false;

    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      isAuthenticatedCache = false;
      return false;
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
};

// Check if user is authenticated (without trying to authenticate)
export const isAuthenticated = async (): Promise<boolean> => {
  if (!supabase) return false;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return Boolean(user);
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação:', error);
    return false;
  }
};

// Get current user
export const getCurrentUser = async () => {
  if (!supabase) return null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user || defaultUser;
  } catch (error) {
    console.error('❌ Erro ao obter usuário atual:', error);
    return defaultUser;
  }
};

// Sign out user
export const signOut = async (): Promise<boolean> => {
  if (!supabase) return false;
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Erro ao fazer logout:', error);
      return false;
    }
    console.log('✅ Logout realizado com sucesso');
    isAuthenticatedCache = false;
    defaultUser = null;
    return true;
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    return false;
  }
};

// Upload de imagem para o bucket de cheques
export const uploadCheckImage = async (file: File, checkId: string, imageType: 'front' | 'back'): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }

  // Ensure authentication before upload
  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Não foi possível autenticar para fazer upload de imagens.');
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

  // Ensure authentication before delete
  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Não foi possível autenticar para deletar imagens.');
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

  // Ensure authentication before upload
  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Não foi possível autenticar para fazer upload de recibos.');
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

  // Ensure authentication before delete
  const isAuth = await ensureAuthenticated();
  if (!isAuth) {
    throw new Error('Não foi possível autenticar para deletar recibos.');
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