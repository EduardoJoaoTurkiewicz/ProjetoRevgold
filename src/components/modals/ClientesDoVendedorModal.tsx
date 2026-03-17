import React, { useState, useMemo } from 'react';
import { X, Search, Users, MapPin, Phone, AlertTriangle, Tag, Filter } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { Cliente } from '../../types';

interface ClientesDoVendedorModalProps {
  vendedorId: string;
  vendedorNome: string;
  onClose: () => void;
}

function getNomeExibicao(c: Cliente): string {
  return c.nomeCompleto ?? c.razaoSocial ?? c.nomeFantasia ?? 'Sem nome';
}

function getDocumento(c: Cliente): string {
  if (c.tipo === 'PF' && c.cpf) return `CPF: ${c.cpf}`;
  if (c.tipo === 'PJ' && c.cnpj) return `CNPJ: ${c.cnpj}`;
  return '';
}

export function ClientesDoVendedorModal({ vendedorId, vendedorNome, onClose }: ClientesDoVendedorModalProps) {
  const { clientes, isLoadingClientes, loadClientesData } = useAppContext();
  const [busca, setBusca] = useState('');
  const [filtroTag, setFiltroTag] = useState<string>('todas');
  const [filtroCidade, setFiltroCidade] = useState<string>('todas');
  const [filtroInadimplente, setFiltroInadimplente] = useState<string>('todos');

  React.useEffect(() => {
    if (clientes.length === 0 && !isLoadingClientes) {
      loadClientesData();
    }
  }, []);

  const clientesDoVendedor = useMemo(() => {
    return clientes.filter(c => c.vendedorResponsavelId === vendedorId);
  }, [clientes, vendedorId]);

  const todasTags = useMemo(() => {
    const set = new Set<string>();
    clientesDoVendedor.forEach(c => (c.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [clientesDoVendedor]);

  const todasCidades = useMemo(() => {
    const set = new Set<string>();
    clientesDoVendedor.forEach(c => {
      if (c.enderecoCidade) set.add(c.enderecoCidade);
    });
    return Array.from(set).sort();
  }, [clientesDoVendedor]);

  const clientesFiltrados = useMemo(() => {
    let result = clientesDoVendedor;

    if (filtroTag !== 'todas') {
      result = result.filter(c => (c.tags || []).includes(filtroTag));
    }

    if (filtroCidade !== 'todas') {
      result = result.filter(c => c.enderecoCidade === filtroCidade);
    }

    if (filtroInadimplente === 'sim') {
      result = result.filter(c => c.inadimplente === true);
    } else if (filtroInadimplente === 'nao') {
      result = result.filter(c => !c.inadimplente);
    }

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const termoDigitos = busca.replace(/\D/g, '');
      result = result.filter(c => {
        const nome = getNomeExibicao(c).toLowerCase();
        const cpfDigits = (c.cpf ?? '').replace(/\D/g, '');
        const cnpjDigits = (c.cnpj ?? '').replace(/\D/g, '');
        return (
          nome.includes(termo) ||
          (c.enderecoCidade ?? '').toLowerCase().includes(termo) ||
          (termoDigitos && cpfDigits.includes(termoDigitos)) ||
          (termoDigitos && cnpjDigits.includes(termoDigitos))
        );
      });
    }

    return result.sort((a, b) => getNomeExibicao(a).localeCompare(getNomeExibicao(b)));
  }, [clientesDoVendedor, busca, filtroTag, filtroCidade, filtroInadimplente]);

  const qtdInadimplentes = useMemo(
    () => clientesDoVendedor.filter(c => c.inadimplente).length,
    [clientesDoVendedor]
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Clientes de {vendedorNome}</h2>
              <p className="text-sm text-gray-500">
                {clientesDoVendedor.length} cliente(s)
                {qtdInadimplentes > 0 && (
                  <span className="ml-2 text-red-500">{qtdInadimplentes} inadimplente(s)</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, CPF, CNPJ ou cidade..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

            {todasTags.length > 0 && (
              <select
                value={filtroTag}
                onChange={e => setFiltroTag(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
              >
                <option value="todas">Todas as tags</option>
                {todasTags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}

            <select
              value={filtroCidade}
              onChange={e => setFiltroCidade(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
            >
              <option value="todas">Todas as cidades</option>
              {todasCidades.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filtroInadimplente}
              onChange={e => setFiltroInadimplente(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
            >
              <option value="todos">Todos</option>
              <option value="sim">Inadimplentes</option>
              <option value="nao">Em dia</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {isLoadingClientes ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {clientesFiltrados.map(cliente => (
                <div key={cliente.id} className="py-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-gray-500">
                      {getNomeExibicao(cliente).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">{getNomeExibicao(cliente)}</span>
                      {cliente.inadimplente && (
                        <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Inadimplente
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {getDocumento(cliente) && (
                        <span className="text-xs text-gray-500">{getDocumento(cliente)}</span>
                      )}
                      {cliente.enderecoCidade && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {cliente.enderecoCidade}{cliente.enderecoUf ? `/${cliente.enderecoUf}` : ''}
                        </span>
                      )}
                      {cliente.telefone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {cliente.telefone}
                        </span>
                      )}
                    </div>
                    {(cliente.tags || []).length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Tag className="w-3 h-3 text-gray-400" />
                        {(cliente.tags || []).map((tag, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-sm text-gray-500">
            Exibindo <span className="font-semibold text-gray-700">{clientesFiltrados.length}</span> de{' '}
            <span className="font-semibold text-gray-700">{clientesDoVendedor.length}</span> clientes
          </p>
        </div>
      </div>
    </div>
  );
}
