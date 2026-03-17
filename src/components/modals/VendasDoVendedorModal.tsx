import React, { useState, useMemo } from 'react';
import { X, Search, ShoppingCart, Filter, Calendar, TrendingUp } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { fmtBRL, fmtDate } from '../../utils/format';
import type { Sale } from '../../types';

interface VendasDoVendedorModalProps {
  sellerId: string;
  sellerName: string;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pago: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700' },
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  parcial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700' },
};

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
  cheque: 'Cheque',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  acerto: 'Acerto',
  permuta: 'Permuta',
};

export function VendasDoVendedorModal({ sellerId, sellerName, onClose }: VendasDoVendedorModalProps) {
  const { sales } = useAppContext();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPagamento, setFiltroPagamento] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const vendasDoVendedor = useMemo(() => {
    return sales.filter((s: Sale) => s.sellerId === sellerId);
  }, [sales, sellerId]);

  const vendasFiltradas = useMemo(() => {
    let result = vendasDoVendedor;

    if (filtroStatus !== 'todos') {
      result = result.filter((s: Sale) => s.status === filtroStatus);
    }

    if (filtroPagamento !== 'todos') {
      result = result.filter((s: Sale) =>
        s.paymentMethods?.some((m: any) => m.type === filtroPagamento)
      );
    }

    if (dataInicio) {
      result = result.filter((s: Sale) => s.date >= dataInicio);
    }
    if (dataFim) {
      result = result.filter((s: Sale) => s.date <= dataFim);
    }

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      result = result.filter((s: Sale) => {
        const produtosTexto = (s.products || [])
          .map((p: any) => p.name || p.nome || '')
          .join(' ')
          .toLowerCase();
        const saleItemsTexto = (s.saleItems || [])
          .map((si: any) => [si.nomeProduto, si.nomeVariacao, si.nomeCor].filter(Boolean).join(' '))
          .join(' ')
          .toLowerCase();
        return (
          (s.client || '').toLowerCase().includes(termo) ||
          (s.id || '').toLowerCase().includes(termo) ||
          (s.observations || '').toLowerCase().includes(termo) ||
          produtosTexto.includes(termo) ||
          saleItemsTexto.includes(termo)
        );
      });
    }

    return result.sort((a: Sale, b: Sale) => b.date.localeCompare(a.date));
  }, [vendasDoVendedor, busca, filtroStatus, filtroPagamento, dataInicio, dataFim]);

  const totalVendido = useMemo(() =>
    vendasFiltradas.reduce((sum: number, s: Sale) => sum + (s.totalValue || 0), 0),
    [vendasFiltradas]
  );

  const totalRecebido = useMemo(() =>
    vendasFiltradas.reduce((sum: number, s: Sale) => sum + (s.receivedAmount || 0), 0),
    [vendasFiltradas]
  );

  const totalPendente = useMemo(() =>
    vendasFiltradas.reduce((sum: number, s: Sale) => sum + (s.pendingAmount || 0), 0),
    [vendasFiltradas]
  );

  const metodosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    vendasDoVendedor.forEach((s: Sale) => {
      s.paymentMethods?.forEach((m: any) => set.add(m.type));
    });
    return Array.from(set);
  }, [vendasDoVendedor]);

  function getPaymentSummary(sale: Sale): string {
    if (!sale.paymentMethods?.length) return '—';
    return sale.paymentMethods
      .map((m: any) => `${PAYMENT_LABELS[m.type] || m.type} ${fmtBRL(m.amount)}`)
      .join(', ');
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vendas de {sellerName}</h2>
              <p className="text-sm text-gray-500">{vendasDoVendedor.length} venda(s) no total</p>
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
              placeholder="Buscar por cliente, produto, observações..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
            >
              <option value="todos">Todos os status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="parcial">Parcial</option>
            </select>

            <select
              value={filtroPagamento}
              onChange={e => setFiltroPagamento(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
            >
              <option value="todos">Todos os pagamentos</option>
              {metodosDisponiveis.map(m => (
                <option key={m} value={m}>{PAYMENT_LABELS[m] || m}</option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 ml-auto">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <span className="text-gray-400 text-sm">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {vendasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma venda encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {vendasFiltradas.map((sale: Sale) => {
                const statusInfo = STATUS_LABELS[sale.status] || { label: sale.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={sale.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{sale.client}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {getPaymentSummary(sale)}
                      </div>
                      {sale.observations && (
                        <div className="text-xs text-gray-400 mt-0.5 truncate italic">{sale.observations}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{fmtBRL(sale.totalValue)}</div>
                        <div className="text-xs text-gray-400">{fmtDate(sale.date)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {vendasFiltradas.length} venda(s) exibida(s)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total vendido</p>
              <p className="text-base font-bold text-gray-900">{fmtBRL(totalVendido)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total recebido</p>
              <p className="text-base font-bold text-emerald-700">{fmtBRL(totalRecebido)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total pendente</p>
              <p className="text-base font-bold text-amber-600">{fmtBRL(totalPendente)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
