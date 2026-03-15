import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Building2,
  User,
  Phone,
  MapPin,
  Tag,
  UserCheck,
  AlertTriangle,
  Filter,
  X,
  ChevronRight,
  Users,
  SlidersHorizontal,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { Cliente, ClienteFiltros } from '../types';
import { obterNomeExibicao, obterDocumento } from '../lib/clienteService';
import { ClienteFormModal } from './forms/ClienteFormModal';
import { ClienteDetalhes } from './ClienteDetalhes';

const FILTROS_VAZIOS: ClienteFiltros = {
  busca: '',
  tipo: '',
  cidade: '',
  tags: [],
  vendedorId: '',
  inadimplente: '',
};

export function ClientesPage() {
  const { clientes, employees, isLoadingClientes, loadClientesData } = useAppContext();
  const [filtros, setFiltros] = useState<ClienteFiltros>(FILTROS_VAZIOS);
  const [showModal, setShowModal] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [showFiltros, setShowFiltros] = useState(false);
  const [tagInputFiltro, setTagInputFiltro] = useState('');

  const vendedores = (employees as any[]).filter(e => e.isSeller);

  useEffect(() => {
    loadClientesData();
  }, []);

  const todasCidades = useMemo(() => {
    const set = new Set<string>();
    clientes.forEach(c => { if (c.enderecoCidade) set.add(c.enderecoCidade); });
    return Array.from(set).sort();
  }, [clientes]);

  const todasTags = useMemo(() => {
    const set = new Set<string>();
    clientes.forEach(c => c.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      if (filtros.busca) {
        const termo = filtros.busca.toLowerCase();
        const nome = obterNomeExibicao(c).toLowerCase();
        const doc = (c.cpf ?? c.cnpj ?? '').replace(/\D/g, '');
        const tel = (c.telefone ?? '').replace(/\D/g, '');
        const buscaDigits = filtros.busca.replace(/\D/g, '');
        const ok =
          nome.includes(termo) ||
          (buscaDigits && doc.includes(buscaDigits)) ||
          (buscaDigits && tel.includes(buscaDigits));
        if (!ok) return false;
      }
      if (filtros.tipo && c.tipo !== filtros.tipo) return false;
      if (filtros.cidade && !c.enderecoCidade.toLowerCase().includes(filtros.cidade.toLowerCase())) return false;
      if (filtros.vendedorId && c.vendedorResponsavelId !== filtros.vendedorId) return false;
      if (filtros.inadimplente === 'sim' && !c.inadimplente) return false;
      if (filtros.inadimplente === 'nao' && c.inadimplente) return false;
      if (filtros.tags.length > 0 && !filtros.tags.some(t => c.tags.includes(t))) return false;
      return true;
    });
  }, [clientes, filtros]);

  const filtrosAtivos = useMemo(() =>
    filtros.tipo !== '' || filtros.cidade !== '' || filtros.tags.length > 0 || filtros.vendedorId !== '' || filtros.inadimplente !== '',
    [filtros]
  );

  const setFiltro = <K extends keyof ClienteFiltros>(key: K, value: ClienteFiltros[K]) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const addTagFiltro = (tag: string) => {
    if (tag && !filtros.tags.includes(tag)) {
      setFiltro('tags', [...filtros.tags, tag]);
    }
    setTagInputFiltro('');
  };

  if (clienteSelecionado) {
    return (
      <ClienteDetalhes
        cliente={clienteSelecionado}
        onVoltar={() => {
          setClienteSelecionado(null);
          loadClientesData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Clientes</h1>
          <p className="text-slate-500 mt-1">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-sky-700 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <UserPlus className="w-5 h-5" />
          Cadastrar novo cliente
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={filtros.busca}
            onChange={e => setFiltro('busca', e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, telefone..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-medium shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
          />
          {filtros.busca && (
            <button
              onClick={() => setFiltro('busca', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFiltros(v => !v)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold border transition-all shadow-sm ${
            filtrosAtivos || showFiltros
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filtros
          {filtrosAtivos && (
            <span className="bg-white text-blue-600 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
              {[filtros.tipo, filtros.cidade, filtros.vendedorId, filtros.inadimplente].filter(Boolean).length + filtros.tags.length}
            </span>
          )}
        </button>
      </div>

      {showFiltros && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-700">Filtros avançados</span>
            </div>
            {filtrosAtivos && (
              <button
                onClick={() => setFiltros(FILTROS_VAZIOS)}
                className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Tipo</label>
              <select
                value={filtros.tipo}
                onChange={e => setFiltro('tipo', e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Todos</option>
                <option value="PJ">Pessoa Jurídica</option>
                <option value="PF">Pessoa Física</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Cidade</label>
              <select
                value={filtros.cidade}
                onChange={e => setFiltro('cidade', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Todas</option>
                {todasCidades.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Vendedor</label>
              <select
                value={filtros.vendedorId}
                onChange={e => setFiltro('vendedorId', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Todos</option>
                {vendedores.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Inadimplência</label>
              <select
                value={filtros.inadimplente}
                onChange={e => setFiltro('inadimplente', e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Todos</option>
                <option value="sim">Inadimplentes</option>
                <option value="nao">Em dia</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Tags</label>
              <div className="flex flex-wrap gap-2 items-center">
                {filtros.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full"
                  >
                    {tag}
                    <button type="button" onClick={() => setFiltro('tags', filtros.tags.filter(t => t !== tag))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {todasTags.filter(t => !filtros.tags.includes(t)).length > 0 && (
                  <select
                    value=""
                    onChange={e => { if (e.target.value) addTagFiltro(e.target.value); }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="">+ Adicionar tag</option>
                    {todasTags.filter(t => !filtros.tags.includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoadingClientes ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-black text-slate-700 mb-2">
            {filtros.busca || filtrosAtivos ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-slate-400 mb-6">
            {filtros.busca || filtrosAtivos
              ? 'Tente ajustar os filtros ou a busca.'
              : 'Cadastre o primeiro cliente para começar.'}
          </p>
          {!filtros.busca && !filtrosAtivos && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-sky-700 transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Cadastrar primeiro cliente
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {clientesFiltrados.map(cliente => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onClick={() => setClienteSelecionado(cliente)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ClienteFormModal
          onClose={() => {
            setShowModal(false);
            loadClientesData();
          }}
        />
      )}
    </div>
  );
}

function ClienteCard({ cliente, onClick }: { cliente: Cliente; onClick: () => void }) {
  const nome = obterNomeExibicao(cliente);
  const documento = obterDocumento(cliente);

  return (
    <button
      onClick={onClick}
      className={`w-full bg-white rounded-2xl border shadow-sm p-5 text-left flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group ${
        cliente.inadimplente
          ? 'border-red-200 hover:border-red-300 bg-red-50/50'
          : 'border-slate-100 hover:border-blue-200'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${
        cliente.inadimplente
          ? 'bg-red-100'
          : 'bg-blue-100 group-hover:bg-blue-200 transition-colors'
      }`}>
        {cliente.tipo === 'PJ'
          ? <Building2 className={`w-6 h-6 ${cliente.inadimplente ? 'text-red-600' : 'text-blue-600'}`} />
          : <User className={`w-6 h-6 ${cliente.inadimplente ? 'text-red-600' : 'text-blue-600'}`} />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`font-black text-base truncate ${cliente.inadimplente ? 'text-red-800' : 'text-slate-800'}`}>
            {nome}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
            cliente.tipo === 'PJ'
              ? 'bg-sky-100 text-sky-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}>
            {cliente.tipo}
          </span>
          {cliente.inadimplente && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1 flex-shrink-0">
              <AlertTriangle className="w-3 h-3" /> Inadimplente
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {documento && (
            <span className="font-mono">{documento}</span>
          )}
          {cliente.telefone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {cliente.telefone}
            </span>
          )}
          {cliente.enderecoCidade && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {cliente.enderecoCidade} - {cliente.enderecoUf}
            </span>
          )}
          {cliente.vendedorNome && (
            <span className="flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> {cliente.vendedorNome}
            </span>
          )}
        </div>
        {cliente.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {cliente.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {cliente.tags.length > 4 && (
              <span className="text-xs text-slate-400 font-medium">+{cliente.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-all group-hover:translate-x-1 ${
        cliente.inadimplente ? 'text-red-400' : 'text-slate-300 group-hover:text-blue-400'
      }`} />
    </button>
  );
}
