import React, { useState, useEffect, useMemo } from 'react';
import {
  Factory,
  Plus,
  Search,
  Calendar,
  Package,
  ChevronDown,
  ChevronUp,
  Printer,
  Loader2,
  Filter,
  X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ProducaoForm } from './forms/ProducaoForm';
import type { ProducaoCompleta } from '../types';

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTimeBR(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function totalItens(producao: ProducaoCompleta): number {
  return producao.itens.reduce((sum, i) => sum + i.quantidade, 0);
}

export default function Producao() {
  const { producoes, isLoadingProducao, loadProducaoData, loadEstoqueData } = useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterDataDe, setFilterDataDe] = useState('');
  const [filterDataAte, setFilterDataAte] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProducaoData();
    loadEstoqueData();
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return producoes.filter(p => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitulo = p.titulo.toLowerCase().includes(q);
        const matchLote = p.lote.toLowerCase().includes(q);
        const matchProduto = p.itens.some(i => i.nomeProduto.toLowerCase().includes(q));
        if (!matchTitulo && !matchLote && !matchProduto) return false;
      }
      if (filterDataDe && p.fabricacaoDate < filterDataDe) return false;
      if (filterDataAte && p.fabricacaoDate > filterDataAte) return false;
      return true;
    });
  }, [producoes, search, filterDataDe, filterDataAte]);

  const stats = useMemo(() => {
    const now = new Date();
    const mes = now.getMonth();
    const ano = now.getFullYear();
    const doMes = producoes.filter(p => {
      const d = new Date(p.fabricacaoDate);
      return d.getMonth() === mes && d.getFullYear() === ano;
    });
    return {
      total: producoes.length,
      totalMes: doMes.length,
      unidadesMes: doMes.reduce((sum, p) => sum + totalItens(p), 0),
    };
  }, [producoes]);

  const clearFilters = () => {
    setSearch('');
    setFilterDataDe('');
    setFilterDataAte('');
  };

  const hasFilters = search || filterDataDe || filterDataAte;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Produção</h1>
          <p className="text-slate-500 font-semibold">Registre lotes e atualize o estoque automaticamente</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black shadow-lg hover:shadow-orange-200 hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Produção
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Factory className="w-6 h-6 opacity-80" />
            <span className="text-sm font-bold opacity-90 uppercase tracking-wider">Total de Produções</span>
          </div>
          <p className="text-4xl font-black">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 opacity-80" />
            <span className="text-sm font-bold opacity-90 uppercase tracking-wider">Este Mês</span>
          </div>
          <p className="text-4xl font-black">{stats.totalMes}</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 opacity-80" />
            <span className="text-sm font-bold opacity-90 uppercase tracking-wider">Unidades este Mês</span>
          </div>
          <p className="text-4xl font-black">{stats.unidadesMes}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título, lote ou produto..."
              className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 border-2 rounded-xl font-bold text-sm transition-colors ${showFilters ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600 hover:border-orange-300'}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2.5 text-red-500 border-2 border-red-100 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Data de</label>
              <input
                type="date"
                value={filterDataDe}
                onChange={e => setFilterDataDe(e.target.value)}
                className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Data até</label>
              <input
                type="date"
                value={filterDataAte}
                onChange={e => setFilterDataAte(e.target.value)}
                className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {isLoadingProducao ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Factory className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-400 mb-2">
            {producoes.length === 0 ? 'Nenhuma produção registrada' : 'Nenhum resultado encontrado'}
          </h3>
          <p className="text-slate-400 font-semibold mb-6">
            {producoes.length === 0
              ? 'Clique em "Nova Produção" para começar.'
              : 'Ajuste os filtros para ver resultados.'}
          </p>
          {producoes.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-black hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Nova Produção
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(producao => {
            const isExpanded = expandedIds.has(producao.id);
            return (
              <div key={producao.id} className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:border-orange-100 transition-colors">
                <div className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Factory className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-slate-800 text-lg leading-tight">{producao.titulo}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                              {producao.lote}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">
                              {formatDateTimeBR(producao.createdAt)}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">
                              Validade: {formatDateBR(producao.validadeDate)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => window.open(`/print/etiquetas/${producao.id}`, '_blank')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Etiquetas
                          </button>
                          <button
                            onClick={() => toggleExpanded(producao.id)}
                            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="text-sm">
                          <span className="text-slate-500 font-semibold">{producao.itens.length} item(ns) · </span>
                          <span className="font-black text-orange-600">{totalItens(producao)} unidades</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {Array.from(new Set(producao.itens.map(i => i.nomeProduto))).slice(0, 3).map(nome => (
                            <span key={nome} className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{nome}</span>
                          ))}
                          {new Set(producao.itens.map(i => i.nomeProduto)).size > 3 && (
                            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              +{new Set(producao.itens.map(i => i.nomeProduto)).size - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t-2 border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fabricação</span>
                        <p className="font-bold text-slate-700">{formatDateBR(producao.fabricacaoDate)}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Validade</span>
                        <p className="font-bold text-slate-700">{formatDateBR(producao.validadeDate)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {producao.itens.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.nomeProduto}</p>
                            <p className="text-xs text-slate-500">
                              {item.nomeVariacao}{item.nomeCor ? ` · ${item.nomeCor}` : ''}
                            </p>
                          </div>
                          <span className="font-black text-orange-600">{item.quantidade}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ProducaoForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadProducaoData();
          }}
        />
      )}
    </div>
  );
}
