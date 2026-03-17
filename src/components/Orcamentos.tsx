import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  FileText,
  Trash2,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { OrcamentoForm } from './forms/OrcamentoForm';
import { abrirPdfOrcamento } from '../utils/orcamentoPdf';
import { fmtBRL, fmtDate } from '../utils/format';
import type { Orcamento } from '../types';

const PAGE_SIZE = 10;

function diasParaVencer(dataValidade: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const validade = new Date(dataValidade + 'T00:00:00');
  return Math.round((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }: { status: Orcamento['status'] }) {
  if (status === 'convertido') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        <CheckCircle2 className="w-3 h-3" />
        Convertido
      </span>
    );
  }
  if (status === 'vencido') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <XCircle className="w-3 h-3" />
        Vencido
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" />
      Pendente
    </span>
  );
}

interface DeleteConfirmProps {
  orcamento: Orcamento;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function DeleteConfirmModal({ orcamento, onConfirm, onCancel, loading }: DeleteConfirmProps) {
  const [confirmText, setConfirmText] = useState('');
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Excluir Orçamento</h3>
            <p className="text-sm text-slate-500">Esta ação não pode ser desfeita.</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 mb-4 text-sm text-red-700">
          Você está prestes a excluir o{' '}
          <strong>Orçamento #{orcamento.numero.toString().padStart(5, '0')}</strong> de{' '}
          <strong>{orcamento.clienteNome}</strong>, no valor de{' '}
          <strong>{fmtBRL(orcamento.valorTotal)}</strong>.
        </div>
        <p className="text-sm text-slate-600 mb-2">
          Digite <strong>EXCLUIR</strong> para confirmar:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="EXCLUIR"
          className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-400 mb-4"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || confirmText !== 'EXCLUIR'}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Orcamentos() {
  const { orcamentos, isLoadingOrcamentos, loadOrcamentosData, deleteOrcamento, navigateToPage, setOrcamentoPrefill } =
    useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Orcamento | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [busca, setBusca] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'pendente' | 'convertido' | 'vencido'>('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadOrcamentosData();
  }, []);

  const filtered = useMemo(() => {
    return orcamentos.filter((o) => {
      if (busca) {
        const q = busca.toLowerCase();
        if (!o.clienteNome.toLowerCase().includes(q) && !o.numero.toString().includes(q)) {
          return false;
        }
      }
      if (filterStatus && o.status !== filterStatus) return false;
      if (filterDataInicio && o.dataCriacao < filterDataInicio) return false;
      if (filterDataFim && o.dataCriacao > filterDataFim) return false;
      return true;
    });
  }, [orcamentos, busca, filterStatus, filterDataInicio, filterDataFim]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendentes = useMemo(() => orcamentos.filter((o) => o.status === 'pendente'), [orcamentos]);
  const convertidos = useMemo(
    () => orcamentos.filter((o) => o.status === 'convertido'),
    [orcamentos]
  );
  const prox3dias = useMemo(
    () =>
      pendentes.filter((o) => {
        const d = diasParaVencer(o.dataValidade);
        return d >= 0 && d <= 3;
      }),
    [pendentes]
  );
  const valorPendente = useMemo(
    () => pendentes.reduce((s, o) => s + o.valorTotal, 0),
    [pendentes]
  );

  function handleSubirParaVenda(orcamento: Orcamento) {
    setOrcamentoPrefill(orcamento);
    navigateToPage('sales');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOrcamento(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setBusca('');
    setFilterStatus('');
    setFilterDataInicio('');
    setFilterDataFim('');
    setPage(1);
  }

  const hasFilters = busca || filterStatus || filterDataInicio || filterDataFim;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Orçamentos</h1>
            <p className="text-sm text-slate-500">
              {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''} · {convertidos.length} convertido{convertidos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-200 transition-all duration-200 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pendentes</div>
          <div className="text-3xl font-bold text-slate-800">{pendentes.length}</div>
          <div className="text-xs text-slate-400 mt-1">orçamentos ativos</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 shadow-sm border border-blue-100 hover:shadow-md transition-shadow duration-200">
          <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">Valor em Aberto</div>
          <div className="text-2xl font-bold text-blue-700">{fmtBRL(valorPendente)}</div>
          <div className="text-xs text-blue-400 mt-1">total pendente</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vencem em 3 dias</div>
          <div className={`text-3xl font-bold ${prox3dias.length > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {prox3dias.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">requer atenção</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Convertidos</div>
          <div className="text-3xl font-bold text-blue-600">{convertidos.length}</div>
          <div className="text-xs text-slate-400 mt-1">virou venda</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por cliente ou número..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as any); setPage(1); }}
            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 text-slate-700 bg-white"
          >
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="convertido">Convertido</option>
            <option value="vencido">Vencido</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDataInicio}
              onChange={(e) => { setFilterDataInicio(e.target.value); setPage(1); }}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              placeholder="Início"
            />
            <span className="text-slate-400 text-sm">–</span>
            <input
              type="date"
              value={filterDataFim}
              onChange={(e) => { setFilterDataFim(e.target.value); setPage(1); }}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
              placeholder="Fim"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl text-sm transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoadingOrcamentos ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 py-3 px-5 border-b border-slate-50">
                <div className="h-4 bg-slate-200 rounded w-16"></div>
                <div className="h-4 bg-slate-200 rounded flex-1"></div>
                <div className="h-4 bg-slate-200 rounded w-24 hidden md:block"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                <div className="h-7 bg-slate-200 rounded-lg w-28"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="text-center">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium text-slate-500 mb-1">
                {hasFilters ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento cadastrado'}
              </p>
              <p className="text-sm">
                {hasFilters
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Clique em "Novo Orçamento" para começar.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nº</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Criação</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Validade</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor Total</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((o) => {
                    const dias = diasParaVencer(o.dataValidade);
                    const expirando = o.status === 'pendente' && dias >= 0 && dias <= 3;
                    return (
                      <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <span className="text-sm font-mono font-semibold text-slate-700">
                            #{o.numero.toString().padStart(5, '0')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">
                            {o.clienteNome}
                          </div>
                          {o.vendedor && o.vendedor !== 'Não se aplica' && (
                            <div className="text-xs text-slate-500 truncate">{o.vendedor}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="text-sm text-slate-600">{fmtDate(o.dataCriacao)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-slate-600">{fmtDate(o.dataValidade)}</span>
                            {expirando && (
                              <span
                                title={`Vence em ${dias} dia${dias !== 1 ? 's' : ''}`}
                                className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 rounded-full"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                              </span>
                            )}
                          </div>
                          {expirando && (
                            <div className="text-xs text-amber-600 font-medium">
                              {dias === 0 ? 'Vence hoje' : `Em ${dias} dia${dias !== 1 ? 's' : ''}`}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-bold text-slate-800">{fmtBRL(o.valorTotal)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => abrirPdfOrcamento(o)}
                              title="Gerar PDF"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              PDF
                            </button>
                            {o.status === 'pendente' && (
                              <button
                                onClick={() => handleSubirParaVenda(o)}
                                title="Subir para Venda"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm active:scale-95"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                Venda
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTarget(o)}
                              title="Excluir"
                              className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  {filtered.length} orçamento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* New orcamento form */}
      {showForm && (
        <OrcamentoForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          orcamento={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
