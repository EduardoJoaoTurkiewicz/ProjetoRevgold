import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ShoppingCart, Filter, Calendar, TrendingUp, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppContext } from '../../context/AppContext';
import { fmtBRL, fmtDate } from '../../utils/format';

interface VendasDoProdutoModalProps {
  produtoId: string;
  produtoNome: string;
  onClose: () => void;
}

interface SaleItemRow {
  id: string;
  saleId: string;
  saleDate: string;
  clientName: string;
  sellerId: string | null;
  sellerName: string;
  nomeVariacao: string;
  nomeCor: string | null;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  paymentMethods: any[];
  saleStatus: string;
  observations: string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cart. Crédito',
  cartao_debito: 'Cart. Débito',
  cheque: 'Cheque',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  acerto: 'Acerto',
  permuta: 'Permuta',
};

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pago: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700' },
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  parcial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700' },
};

export function VendasDoProdutoModal({ produtoId, produtoNome, onClose }: VendasDoProdutoModalProps) {
  const { employees } = useAppContext();
  const [rows, setRows] = useState<SaleItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroVendedor, setFiltroVendedor] = useState<string>('todos');
  const [filtroPagamento, setFiltroPagamento] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sale_items')
          .select(`
            id,
            sale_id,
            quantidade,
            valor_unitario,
            valor_total,
            estoque_variacoes!inner(nome_variacao),
            estoque_cores(nome_cor),
            sales!inner(
              id,
              date,
              client,
              seller_id,
              payment_methods,
              status,
              observations
            )
          `)
          .eq('produto_id', produtoId);

        if (error) throw error;

        const employeeMap: Record<string, string> = {};
        employees.forEach((e: any) => { employeeMap[e.id] = e.name; });

        const mapped: SaleItemRow[] = (data || []).map((item: any) => {
          const sale = item.sales;
          const sellerId = sale?.seller_id || null;
          return {
            id: item.id,
            saleId: item.sale_id,
            saleDate: sale?.date || '',
            clientName: sale?.client || '',
            sellerId,
            sellerName: sellerId ? (employeeMap[sellerId] || 'Desconhecido') : '—',
            nomeVariacao: item.estoque_variacoes?.nome_variacao || '',
            nomeCor: item.estoque_cores?.nome_cor || null,
            quantidade: Number(item.quantidade) || 0,
            valorUnitario: Number(item.valor_unitario) || 0,
            valorTotal: Number(item.valor_total) || 0,
            paymentMethods: sale?.payment_methods || [],
            saleStatus: sale?.status || '',
            observations: sale?.observations || null,
          };
        });

        setRows(mapped.sort((a, b) => b.saleDate.localeCompare(a.saleDate)));
      } catch (err) {
        console.error('Error loading product sales:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [produtoId, employees]);

  const vendedoresDisponiveis = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach(r => {
      if (r.sellerId) map.set(r.sellerId, r.sellerName);
    });
    return Array.from(map.entries());
  }, [rows]);

  const metodosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => r.paymentMethods.forEach((m: any) => set.add(m.type)));
    return Array.from(set);
  }, [rows]);

  const rowsFiltrados = useMemo(() => {
    let result = rows;

    if (filtroVendedor !== 'todos') {
      result = result.filter(r => r.sellerId === filtroVendedor);
    }
    if (filtroPagamento !== 'todos') {
      result = result.filter(r => r.paymentMethods.some((m: any) => m.type === filtroPagamento));
    }
    if (dataInicio) result = result.filter(r => r.saleDate >= dataInicio);
    if (dataFim) result = result.filter(r => r.saleDate <= dataFim);

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      result = result.filter(r =>
        r.clientName.toLowerCase().includes(termo) ||
        (r.observations || '').toLowerCase().includes(termo) ||
        r.nomeVariacao.toLowerCase().includes(termo) ||
        (r.nomeCor || '').toLowerCase().includes(termo)
      );
    }

    return result;
  }, [rows, busca, filtroVendedor, filtroPagamento, dataInicio, dataFim]);

  const totais = useMemo(() => ({
    quantidade: rowsFiltrados.reduce((s, r) => s + r.quantidade, 0),
    valor: rowsFiltrados.reduce((s, r) => s + r.valorTotal, 0),
  }), [rowsFiltrados]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vendas: {produtoNome}</h2>
              <p className="text-sm text-gray-500">{rows.length} item(s) vendido(s) no total</p>
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
              placeholder="Buscar por cliente, variação, cor, observações..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

            {vendedoresDisponiveis.length > 0 && (
              <select
                value={filtroVendedor}
                onChange={e => setFiltroVendedor(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
              >
                <option value="todos">Todos os vendedores</option>
                {vendedoresDisponiveis.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            )}

            <select
              value={filtroPagamento}
              onChange={e => setFiltroPagamento(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
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
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <span className="text-gray-400 text-sm">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-sm">Carregando vendas...</span>
            </div>
          ) : rowsFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma venda encontrada para este produto</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendedor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Variação</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qtd</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit.</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rowsFiltrados.map(row => {
                    const st = STATUS_INFO[row.saleStatus] || { label: row.saleStatus, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(row.saleDate)}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{row.clientName}</td>
                        <td className="px-4 py-3 text-gray-600">{row.sellerName}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {row.nomeVariacao}
                          {row.nomeCor && <span className="text-gray-400"> / {row.nomeCor}</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">{row.quantidade}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{fmtBRL(row.valorUnitario)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-semibold">{fmtBRL(row.valorTotal)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {rowsFiltrados.length} item(s) exibido(s)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total de unidades vendidas</p>
              <p className="text-base font-bold text-gray-900">{totais.quantidade} un.</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Receita total</p>
              <p className="text-base font-bold text-emerald-700">{fmtBRL(totais.valor)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
