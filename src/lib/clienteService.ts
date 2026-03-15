import { supabase } from './supabase';
import type { Cliente, ClienteFormData, ClienteFiltros } from '../types';

function toCamelCase(row: any): Cliente {
  return {
    id: row.id,
    tipo: row.tipo,
    razaoSocial: row.razao_social ?? null,
    nomeFantasia: row.nome_fantasia ?? null,
    nomeCompleto: row.nome_completo ?? null,
    cnpj: row.cnpj ?? null,
    cpf: row.cpf ?? null,
    telefone: row.telefone ?? '',
    email: row.email ?? null,
    enderecoRua: row.endereco_rua ?? null,
    enderecoNumero: row.endereco_numero ?? null,
    enderecoBairro: row.endereco_bairro ?? null,
    enderecoCidade: row.endereco_cidade ?? '',
    enderecoUf: row.endereco_uf ?? '',
    enderecoCep: row.endereco_cep ?? null,
    enderecoComplemento: row.endereco_complemento ?? null,
    vendedorResponsavelId: row.vendedor_responsavel_id ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vendedorNome: row.employees?.name ?? undefined,
    inadimplente: false,
  };
}

function toSnakeCase(data: Partial<ClienteFormData>): Record<string, any> {
  const raw: Record<string, any> = {};
  if (data.tipo !== undefined) raw.tipo = data.tipo;
  if (data.razaoSocial !== undefined) raw.razao_social = data.razaoSocial || null;
  if (data.nomeFantasia !== undefined) raw.nome_fantasia = data.nomeFantasia || null;
  if (data.nomeCompleto !== undefined) raw.nome_completo = data.nomeCompleto || null;
  if (data.cnpj !== undefined) raw.cnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : null;
  if (data.cpf !== undefined) raw.cpf = data.cpf ? data.cpf.replace(/\D/g, '') : null;
  if (data.telefone !== undefined) raw.telefone = data.telefone;
  if (data.email !== undefined) raw.email = data.email || null;
  if (data.enderecoRua !== undefined) raw.endereco_rua = data.enderecoRua || null;
  if (data.enderecoNumero !== undefined) raw.endereco_numero = data.enderecoNumero || null;
  if (data.enderecoBairro !== undefined) raw.endereco_bairro = data.enderecoBairro || null;
  if (data.enderecoCidade !== undefined) raw.endereco_cidade = data.enderecoCidade;
  if (data.enderecoUf !== undefined) raw.endereco_uf = data.enderecoUf;
  if (data.enderecoCep !== undefined) raw.endereco_cep = data.enderecoCep || null;
  if (data.enderecoComplemento !== undefined) raw.endereco_complemento = data.enderecoComplemento || null;
  if (data.vendedorResponsavelId !== undefined) raw.vendedor_responsavel_id = data.vendedorResponsavelId || null;
  if (data.tags !== undefined) raw.tags = data.tags;
  return raw;
}

export async function listarClientes(filtros?: Partial<ClienteFiltros>): Promise<Cliente[]> {
  let query = supabase
    .from('clientes')
    .select('*, employees(name)')
    .order('created_at', { ascending: false });

  if (filtros?.tipo) {
    query = query.eq('tipo', filtros.tipo);
  }
  if (filtros?.cidade) {
    query = query.ilike('endereco_cidade', `%${filtros.cidade}%`);
  }
  if (filtros?.vendedorId) {
    query = query.eq('vendedor_responsavel_id', filtros.vendedorId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const clientes = (data ?? []).map(toCamelCase);

  if (filtros?.busca) {
    const termo = filtros.busca.toLowerCase();
    return clientes.filter(c => {
      const nome = (c.nomeCompleto ?? c.razaoSocial ?? c.nomeFantasia ?? '').toLowerCase();
      const doc = (c.cpf ?? c.cnpj ?? '').replace(/\D/g, '');
      const tel = (c.telefone ?? '').replace(/\D/g, '');
      const buscaDigits = filtros.busca!.replace(/\D/g, '');
      return (
        nome.includes(termo) ||
        (buscaDigits && doc.includes(buscaDigits)) ||
        (buscaDigits && tel.includes(buscaDigits))
      );
    });
  }

  if (filtros?.tags && filtros.tags.length > 0) {
    return clientes.filter(c =>
      filtros.tags!.some(tag => c.tags.includes(tag))
    );
  }

  return clientes;
}

export async function buscarClientePorId(id: string): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*, employees(name)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return toCamelCase(data);
}

export async function criarCliente(formData: ClienteFormData): Promise<Cliente> {
  const payload = toSnakeCase(formData);
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('clientes')
    .insert(payload)
    .select('*, employees(name)')
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function atualizarCliente(id: string, formData: Partial<ClienteFormData>): Promise<Cliente> {
  const payload = toSnakeCase(formData);
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .select('*, employees(name)')
    .single();

  if (error) throw error;
  return toCamelCase(data);
}

export async function deletarCliente(id: string): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function obterNomeExibicao(cliente: Cliente): string {
  if (cliente.tipo === 'PJ') {
    return cliente.nomeFantasia || cliente.razaoSocial || 'Sem nome';
  }
  return cliente.nomeCompleto || 'Sem nome';
}

export function obterDocumento(cliente: Cliente): string {
  if (cliente.tipo === 'PJ') {
    return cliente.cnpj ? formatarCNPJ(cliente.cnpj) : '';
  }
  return cliente.cpf ? formatarCPF(cliente.cpf) : '';
}

export function formatarCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatarCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
}

export function validarCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (d: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += parseInt(d[i]) * weights[i];
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  return calc(digits, w1) === parseInt(digits[12]) && calc(digits, w2) === parseInt(digits[13]);
}

export function aplicarMascaraCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function aplicarMascaraCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}
