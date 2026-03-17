import React, { useState, useMemo } from 'react';
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, Tag, CreditCard as Edit3, Trash2, ShoppingCart, AlertTriangle, BarChart2, Calendar, BadgeCheck, UserCheck, Clock } from 'lucide-react';
import type { Cliente, Sale } from '../types';
import { obterNomeExibicao, obterDocumento } from '../lib/clienteService';
import { ClienteFormModal } from './forms/ClienteFormModal';
import { useAppContext } from '../context/AppContext';
import { fmtBRL, fmtDate } from '../utils/format';

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pago: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700' },
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  parcial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700' },
};

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

interface Props {
  cliente: Cliente;
  onVoltar: () => void;
}

export function ClienteDetalhes({ cliente, onVoltar }: Props) {
  const { deleteCliente, sales, checks, boletos } = useAppContext();
  const [editando, setEditando] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');

  const nome = obterNomeExibicao(cliente);
  const documento = obterDocumento(cliente);

  const handleDelete = async () => {
    setDeletando(true);
    try {
      await deleteCliente(cliente.id);
      onVoltar();
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
    } finally {
      setDeletando(false);
      setConfirmarExclusao(false);
    }
  };

  const vendasDoCliente = useMemo(() => {
    return (sales as Sale[]).filter(s => s.client === nome);
  }, [sales, nome]);

  const vendasFiltradas = useMemo(() => {
    let result = vendasDoCliente;
    if (periodoInicio) result = result.filter(s => s.date >= periodoInicio);
    if (periodoFim) result = result.filter(s => s.date <= periodoFim);
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [vendasDoCliente, periodoInicio, periodoFim]);

  const resumoVendas = useMemo(() => {
    const total = vendasFiltradas.reduce((s, v) => s + (v.totalValue || 0), 0);
    const count = vendasFiltradas.length;
    return { total, count, ticket: count > 0 ? total / count : 0 };
  }, [vendasFiltradas]);

  const pendencias = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const result: Array<{
      tipo: string;
      descricao: string;
      vencimento: string;
      valor: number;
      vencido: boolean;
      saleClient: string;
    }> = [];

    vendasDoCliente.forEach(sale => {
      const checksVenda = (checks as any[]).filter(
        c => c.saleId === sale.id && c.status === 'pendente'
      );
      checksVenda.forEach(c => {
        result.push({
          tipo: 'Cheque',
          descricao: `Venda - ${sale.client}`,
          vencimento: c.dueDate || '',
          valor: c.value || 0,
          vencido: c.dueDate ? c.dueDate < hoje : false,
          saleClient: sale.client,
        });
      });

      const boletosVenda = (boletos as any[]).filter(
        b => b.saleId === sale.id && (b.status === 'pendente' || b.status === 'vencido')
      );
      boletosVenda.forEach(b => {
        result.push({
          tipo: 'Boleto',
          descricao: `Venda - ${sale.client}`,
          vencimento: b.dueDate || '',
          valor: b.value || 0,
          vencido: b.status === 'vencido' || (b.dueDate ? b.dueDate < hoje : false),
          saleClient: sale.client,
        });
      });

      if (sale.pendingAmount > 0) {
        const hasCheck = checks.some((c: any) => c.saleId === sale.id && c.status === 'pendente');
        const hasBoleto = boletos.some((b: any) => b.saleId === sale.id && (b.status === 'pendente' || b.status === 'vencido'));
        const payTypes = (sale.paymentMethods || []).map((m: any) => m.type);
        const hasPendingDoc = hasCheck || hasBoleto;
        const hasInstantOnly = payTypes.every((t: string) => ['dinheiro', 'pix', 'cartao_debito'].includes(t));

        if (!hasPendingDoc && !hasInstantOnly && sale.pendingAmount > 0) {
          result.push({
            tipo: 'Saldo',
            descricao: `Venda - ${sale.client}`,
            vencimento: sale.deliveryDate || sale.date || '',
            valor: sale.pendingAmount,
            vencido: (sale.deliveryDate || sale.date) < hoje,
            saleClient: sale.client,
          });
        }
      }
    });

    return result.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }, [vendasDoCliente, checks, boletos]);

  const totalPendente = useMemo(
    () => pendencias.reduce((s, p) => s + p.valor, 0),
    [pendencias]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onVoltar}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Voltar à lista
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setEditando(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => setConfirmarExclusao(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      </div>

      <div className={`rounded-3xl p-8 shadow-xl text-white relative overflow-hidden ${
        cliente.inadimplente
          ? 'bg-gradient-to-r from-red-600 to-rose-700'
          : 'bg-gradient-to-r from-blue-600 to-sky-700'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            {cliente.tipo === 'PJ'
              ? <Building2 className="w-10 h-10 text-white" />
              : <User className="w-10 h-10 text-white" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wide">
                {cliente.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              </span>
              {cliente.inadimplente && (
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Inadimplente
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black truncate">{nome}</h1>
            {cliente.tipo === 'PJ' && cliente.razaoSocial && cliente.nomeFantasia !== cliente.razaoSocial && (
              <p className="text-white/70 font-medium mt-0.5">{cliente.razaoSocial}</p>
            )}
            {documento && (
              <p className="text-white/80 font-mono text-sm mt-1">
                {cliente.tipo === 'PJ' ? 'CNPJ' : 'CPF'}: {documento}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-3">
              {cliente.telefone && (
                <span className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Phone className="w-4 h-4" /> {cliente.telefone}
                </span>
              )}
              {cliente.email && (
                <span className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Mail className="w-4 h-4" /> {cliente.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard icon={<MapPin className="w-5 h-5" />} title="Endereço">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {(cliente.enderecoRua || cliente.enderecoNumero) && (
                <InfoItem label="Logradouro" value={[cliente.enderecoRua, cliente.enderecoNumero].filter(Boolean).join(', ')} />
              )}
              {cliente.enderecoBairro && <InfoItem label="Bairro" value={cliente.enderecoBairro} />}
              <InfoItem label="Cidade / UF" value={`${cliente.enderecoCidade} - ${cliente.enderecoUf}`} />
              {cliente.enderecoCep && <InfoItem label="CEP" value={cliente.enderecoCep} />}
              {cliente.enderecoComplemento && (
                <div className="col-span-2">
                  <InfoItem label="Complemento" value={cliente.enderecoComplemento} />
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={<ShoppingCart className="w-5 h-5" />} title={`Histórico de Compras (${vendasDoCliente.length})`}>
            {vendasDoCliente.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-semibold text-sm">Nenhuma compra registrada</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {vendasDoCliente.slice(0, 20).map(sale => {
                  const st = STATUS_INFO[sale.status] || { label: sale.status, color: 'bg-gray-100 text-gray-600' };
                  const payNames = (sale.paymentMethods || [])
                    .map((m: any) => PAYMENT_LABELS[m.type] || m.type)
                    .join(', ');
                  return (
                    <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                          <span className="text-xs text-slate-500">{fmtDate(sale.date)}</span>
                        </div>
                        {payNames && <p className="text-xs text-slate-400 mt-0.5 truncate">{payNames}</p>}
                      </div>
                      <span className="text-sm font-bold text-slate-800 flex-shrink-0">{fmtBRL(sale.totalValue)}</span>
                    </div>
                  );
                })}
                {vendasDoCliente.length > 20 && (
                  <p className="text-xs text-center text-slate-400 pt-1">
                    +{vendasDoCliente.length - 20} vendas não exibidas
                  </p>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard icon={<AlertTriangle className="w-5 h-5" />} title="Pendências Financeiras">
            {pendencias.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <BadgeCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-semibold text-sm">Nenhuma pendência encontrada</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-sm font-bold text-amber-800">Total pendente</span>
                  <span className="text-base font-black text-amber-700">{fmtBRL(totalPendente)}</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pendencias.map((p, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${p.vencido ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-transparent'}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.vencido ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                            {p.tipo}
                          </span>
                          {p.vencido && (
                            <span className="flex items-center gap-0.5 text-xs text-red-600">
                              <Clock className="w-3 h-3" />
                              Vencido
                            </span>
                          )}
                        </div>
                        {p.vencimento && (
                          <p className="text-xs text-slate-500 mt-0.5">Venc.: {fmtDate(p.vencimento)}</p>
                        )}
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${p.vencido ? 'text-red-700' : 'text-slate-800'}`}>
                        {fmtBRL(p.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          {(cliente.vendedorNome || cliente.vendedorResponsavelId) && (
            <SectionCard icon={<UserCheck className="w-5 h-5" />} title="Vendedor Responsável">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-slate-700">
                  {cliente.vendedorNome ?? 'Vendedor vinculado'}
                </span>
              </div>
            </SectionCard>
          )}

          {cliente.tags.length > 0 && (
            <SectionCard icon={<Tag className="w-5 h-5" />} title="Tags">
              <div className="flex flex-wrap gap-2">
                {cliente.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard icon={<BarChart2 className="w-5 h-5" />} title="Resumo de Vendas">
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">De</label>
                <input
                  type="date"
                  value={periodoInicio}
                  onChange={e => setPeriodoInicio(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Até</label>
                <input
                  type="date"
                  value={periodoFim}
                  onChange={e => setPeriodoFim(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="space-y-3">
              <SummaryRow label="Total vendido" value={fmtBRL(resumoVendas.total)} />
              <SummaryRow label="Número de vendas" value={String(resumoVendas.count)} />
              <SummaryRow label="Ticket médio" value={fmtBRL(resumoVendas.ticket)} />
            </div>
            {(periodoInicio || periodoFim) && (
              <p className="text-xs text-slate-400 mt-3 text-center">
                Filtrado por período
              </p>
            )}
          </SectionCard>

          <SectionCard icon={<Calendar className="w-5 h-5" />} title="Cadastro">
            <div className="space-y-2 text-sm">
              <InfoItem label="Cadastrado em" value={new Date(cliente.createdAt).toLocaleDateString('pt-BR')} />
              <InfoItem label="Atualizado em" value={new Date(cliente.updatedAt).toLocaleDateString('pt-BR')} />
            </div>
          </SectionCard>
        </div>
      </div>

      {editando && (
        <ClienteFormModal
          clienteParaEditar={cliente}
          onClose={() => {
            setEditando(false);
            onVoltar();
          }}
        />
      )}

      {confirmarExclusao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">Excluir cliente?</h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              Esta ação não pode ser desfeita. O cadastro de <strong>{nome}</strong> será removido permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarExclusao(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deletando}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletando ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-blue-600">{icon}</div>
        <h3 className="font-bold text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-bold text-slate-700">{value}</span>
    </div>
  );
}
