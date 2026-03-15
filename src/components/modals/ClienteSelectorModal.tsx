import React, { useState, useMemo } from 'react';
import { X, Search, User, Phone, MapPin, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { Cliente } from '../../types';

interface ClienteSelectorModalProps {
  onSelect: (cliente: Cliente) => void;
  onClose: () => void;
}

export function ClienteSelectorModal({ onSelect, onClose }: ClienteSelectorModalProps) {
  const { clientes, isLoadingClientes, loadClientesData } = useAppContext();
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<Cliente | null>(null);

  React.useEffect(() => {
    if (clientes.length === 0 && !isLoadingClientes) {
      loadClientesData();
    }
  }, []);

  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes;
    const termo = busca.toLowerCase();
    return clientes.filter(c => {
      const nome = c.nomeCompleto ?? c.razaoSocial ?? c.nomeFantasia ?? '';
      return (
        nome.toLowerCase().includes(termo) ||
        (c.cpf ?? '').replace(/\D/g, '').includes(termo) ||
        (c.cnpj ?? '').replace(/\D/g, '').includes(termo) ||
        (c.telefone ?? '').replace(/\D/g, '').includes(termo) ||
        (c.enderecoCidade ?? '').toLowerCase().includes(termo)
      );
    });
  }, [clientes, busca]);

  function getNome(c: Cliente): string {
    return c.nomeCompleto ?? c.razaoSocial ?? c.nomeFantasia ?? 'Sem nome';
  }

  function getDocumento(c: Cliente): string {
    if (c.tipo === 'PF' && c.cpf) return `CPF: ${c.cpf}`;
    if (c.tipo === 'PJ' && c.cnpj) return `CNPJ: ${c.cnpj}`;
    return '';
  }

  function handleConfirm() {
    if (selecionado) {
      onSelect(selecionado);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[200] backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600">
              <User className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Selecionar Cliente</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, CPF, CNPJ, telefone ou cidade..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoadingClientes ? (
            <div className="text-center py-12 text-slate-500">Carregando clientes...</div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {busca ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado.'}
            </div>
          ) : (
            clientesFiltrados.map(cliente => {
              const isSelected = selecionado?.id === cliente.id;
              return (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => setSelecionado(cliente)}
                  onDoubleClick={() => { setSelecionado(cliente); onSelect(cliente); onClose(); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{getNome(cliente)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          cliente.tipo === 'PF' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>{cliente.tipo}</span>
                        {cliente.inadimplente && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Inadimplente</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        {getDocumento(cliente) && <span>{getDocumento(cliente)}</span>}
                        {cliente.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {cliente.telefone}
                          </span>
                        )}
                        {cliente.enderecoCidade && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {cliente.enderecoCidade}/{cliente.enderecoUf}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="ml-3 p-1 rounded-full bg-blue-600 flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-slate-500">
            {clientesFiltrados.length} cliente(s) encontrado(s)
          </span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selecionado}
              className={`btn-primary px-4 py-2 ${!selecionado ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Confirmar Seleção
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
