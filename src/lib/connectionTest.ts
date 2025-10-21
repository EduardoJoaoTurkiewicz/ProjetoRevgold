/**
 * Testes de conectividade para diagnosticar problemas de conexão
 */

export async function testBasicConnectivity(): Promise<{
  internetAvailable: boolean;
  supabaseReachable: boolean;
  supabaseApiWorking: boolean;
  error?: string;
}> {
  const result = {
    internetAvailable: false,
    supabaseReachable: false,
    supabaseApiWorking: false,
    error: undefined as string | undefined,
  };

  // 1. Verificar se há internet
  result.internetAvailable = navigator.onLine;

  if (!result.internetAvailable) {
    result.error = 'Sem conexão com a internet';
    return result;
  }

  // 2. Testar se o domínio Supabase está acessível
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    result.error = 'URL do Supabase não configurada';
    return result;
  }

  try {
    // Testar conectividade básica com o domínio
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(supabaseUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    result.supabaseReachable = response.ok || response.status < 500;
  } catch (error: any) {
    console.error('Erro ao testar conectividade com Supabase:', error);

    if (error.name === 'AbortError') {
      result.error = 'Timeout ao conectar ao Supabase (>5s)';
    } else if (error.message?.includes('fetch') || error.message?.includes('NetworkError')) {
      result.error = 'Erro de rede ao acessar Supabase';
    } else {
      result.error = error.message || 'Erro desconhecido';
    }

    return result;
  }

  // 3. Testar se a API do Supabase está funcionando
  try {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!anonKey || anonKey === 'placeholder-key') {
      result.error = 'Chave anon do Supabase não configurada';
      return result;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${supabaseUrl}/rest/v1/employees?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      result.supabaseApiWorking = true;
    } else {
      result.error = `API retornou status ${response.status}: ${response.statusText}`;
    }
  } catch (error: any) {
    console.error('Erro ao testar API do Supabase:', error);

    if (error.name === 'AbortError') {
      result.error = 'Timeout ao testar API (>5s)';
    } else {
      result.error = error.message || 'Erro ao testar API';
    }
  }

  return result;
}

/**
 * Diagnóstico completo de conectividade
 */
export async function runConnectionDiagnostic(): Promise<string> {
  console.log('🔍 Iniciando diagnóstico de conectividade...');

  const test = await testBasicConnectivity();

  let diagnosis = '📊 Resultado do Diagnóstico:\n\n';

  diagnosis += `✓ Internet: ${test.internetAvailable ? '✅ Disponível' : '❌ Indisponível'}\n`;
  diagnosis += `✓ Supabase Acessível: ${test.supabaseReachable ? '✅ Sim' : '❌ Não'}\n`;
  diagnosis += `✓ API Funcionando: ${test.supabaseApiWorking ? '✅ Sim' : '❌ Não'}\n`;

  if (test.error) {
    diagnosis += `\n⚠️ Erro: ${test.error}\n`;
  }

  if (!test.internetAvailable) {
    diagnosis += '\n🔧 Solução: Verifique sua conexão com a internet.';
  } else if (!test.supabaseReachable) {
    diagnosis += '\n🔧 Solução: O servidor Supabase pode estar inacessível. Verifique:\n';
    diagnosis += '   - Se o URL no .env está correto\n';
    diagnosis += '   - Se há firewall bloqueando a conexão\n';
    diagnosis += '   - Se o projeto Supabase está ativo';
  } else if (!test.supabaseApiWorking) {
    diagnosis += '\n🔧 Solução: A API do Supabase não está respondendo. Verifique:\n';
    diagnosis += '   - Se a chave ANON_KEY no .env está correta\n';
    diagnosis += '   - Se as tabelas foram criadas (rode as migrações)\n';
    diagnosis += '   - Se há políticas RLS bloqueando o acesso';
  } else {
    diagnosis += '\n✅ Tudo funcionando corretamente!';
  }

  console.log(diagnosis);
  return diagnosis;
}
