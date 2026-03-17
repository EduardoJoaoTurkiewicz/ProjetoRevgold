import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Package,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ClienteSelectorModal } from '../modals/ClienteSelectorModal';
import { ProdutoSelectorModal } from '../modals/ProdutoSelectorModal';
import type { Cliente, OrcamentoItem, SaleItem } from '../../types';
import { fmtBRL, fmtDate } from '../../utils/format';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function saleItemToOrcamentoItem(item: SaleItem): OrcamentoItem {
  return {
    produtoId: item.produtoId,
    variacaoId: item.variacaoId,
    corId: item.corId ?? null,
    nomeProduto: item.nomeProduto ?? '',
    nomeVariacao: item.nomeVariacao ?? '',
    nomeCor: item.nomeCor ?? null,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
    subtotal: item.valorTotal,
  };
}

function orcamentoItemToSaleItem(item: OrcamentoItem): SaleItem {
  return {
    produtoId: item.produtoId,
    variacaoId: item.variacaoId,
    corId: item.corId ?? null,
    nomeProduto: item.nomeProduto,
    nomeVariacao: item.nomeVariacao,
    nomeCor: item.nomeCor ?? undefined,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
    valorTotal: item.subtotal,
  };
}

interface OrcamentoFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function OrcamentoForm({ onClose, onSuccess }: OrcamentoFormProps) {
  const { createOrcamento, employees } = useAppContext();

  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [vendedor, setVendedor] = useState('Não se aplica');
  const [dataValidade, setDataValidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<OrcamentoItem[]>([]);

  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vendedoresDisponiveis = useMemo(() => {
    return employees.filter((e: any) => e.role === 'vendedor' || e.position === 'Vendedor' || true);
  }, [employees]);

  const valorTotal = useMemo(
    () => itens.reduce((sum, item) => sum + item.subtotal, 0),
    [itens]
  );

  function handleClienteSelect(cliente: Cliente) {
    setClienteSelecionado(cliente);
    if (cliente.vendedorNome) {
      setVendedor(cliente.vendedorNome);
    } else {
      setVendedor('Não se aplica');
    }
    setShowClienteModal(false);
    setErrors((prev) => ({ ...prev, cliente: '' }));
  }

  function handleProdutosConfirm(saleItens: SaleItem[]) {
    setItens(saleItens.map(saleItemToOrcamentoItem));
    setErrors((prev) => ({ ...prev, itens: '' }));
  }

  function handleRemoveItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleQuantidadeChange(idx: number, value: string) {
    const qty = parseFloat(value) || 0;
    setItens((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, quantidade: qty, subtotal: qty * item.valorUnitario }
          : item
      )
    );
  }

  function handleValorUnitarioChange(idx: number, value: string) {
    const val = parseFloat(value.replace(',', '.')) || 0;
    setItens((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, valorUnitario: val, subtotal: item.quantidade * val }
          : item
      )
    );
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!clienteSelecionado) newErrors.cliente = 'Selecione um cliente.';
    if (itens.length === 0) newErrors.itens = 'Adicione ao menos um produto.';
    if (!dataValidade) {
      newErrors.dataValidade = 'Informe a data de validade.';
    } else if (dataValidade < getTodayString()) {
      newErrors.dataValidade = 'A data de validade deve ser hoje ou futura.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleConcluir() {
    if (validate()) setShowConfirm(true);
  }

  async function handleConfirmSave() {
    if (!clienteSelecionado) return;
    setSaving(true);
    try {
      const nomeCliente =
        clienteSelecionado.nomeCompleto ??
        clienteSelecionado.razaoSocial ??
        clienteSelecionado.nomeFantasia ??
        '';
      await createOrcamento({
        clienteId: clienteSelecionado.id,
        clienteNome: nomeCliente,
        vendedor,
        dataCriacao: getTodayString(),
        dataValidade,
        valorTotal,
        status: 'pendente',
        observacoes: observacoes || null,
        vendaId: null,
        itens,
      });
      setShowConfirm(false);
      onSuccess();
    } catch (err) {
      console.error('Erro ao criar orçamento:', err);
    } finally {
      setSaving(false);
    }
  }

  const saleItensForModal: SaleItem[] = itens.map(orcamentoItemToSaleItem);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Novo Orçamento</h2>
                <p className="text-sm text-slate-500">Preencha os dados do orçamento</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Cliente + Vendedor row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowClienteModal(true)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-2 rounded-xl text-left transition-colors ${
                    clienteSelecionado
                      ? 'border-blue-300 bg-blue-50'
                      : errors.cliente
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50'
                  }`}
                >
                  <User
                    className={`w-4 h-4 flex-shrink-0 ${
                      clienteSelecionado ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium truncate ${
                      clienteSelecionado ? 'text-blue-800' : 'text-slate-500'
                    }`}
                  >
                    {clienteSelecionado
                      ? clienteSelecionado.nomeCompleto ??
                        clienteSelecionado.razaoSocial ??
                        clienteSelecionado.nomeFantasia
                      : 'Selecionar cliente...'}
                  </span>
                </button>
                {errors.cliente && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.cliente}
                  </p>
                )}
              </div>

              {/* Vendedor */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Vendedor
                </label>
                <input
                  type="text"
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value)}
                  placeholder="Vendedor responsável"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-slate-50"
                />
              </div>
            </div>

            {/* Data validade + observacoes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Validade do Orçamento <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={dataValidade}
                    onChange={(e) => {
                      setDataValidade(e.target.value);
                      setErrors((prev) => ({ ...prev, dataValidade: '' }));
                    }}
                    min={getTodayString()}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-slate-50 ${
                      errors.dataValidade ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.dataValidade && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.dataValidade}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações opcionais..."
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-slate-50 resize-none"
                />
              </div>
            </div>

            {/* Produtos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-700">
                  Itens do Orçamento <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowProdutoModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Package className="w-4 h-4" />
                  {itens.length > 0 ? 'Editar Produtos' : 'Adicionar Produtos'}
                </button>
              </div>

              {errors.itens && (
                <p className="mb-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.itens}
                </p>
              )}

              {itens.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nenhum produto adicionado</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Produto</th>
                        <th className="text-center px-3 py-3 font-semibold text-slate-600 w-24">Qtd</th>
                        <th className="text-right px-3 py-3 font-semibold text-slate-600 w-32">Valor Unit.</th>
                        <th className="text-right px-3 py-3 font-semibold text-slate-600 w-32">Subtotal</th>
                        <th className="w-10 px-2 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itens.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{item.nomeProduto}</div>
                            <div className="text-xs text-slate-500">
                              {item.nomeVariacao}
                              {item.nomeCor ? ` · ${item.nomeCor}` : ''}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={item.quantidade}
                              onChange={(e) => handleQuantidadeChange(idx, e.target.value)}
                              className="w-full text-center px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.valorUnitario}
                              onChange={(e) => handleValorUnitarioChange(idx, e.target.value)}
                              className="w-full text-right px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                            />
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-800">
                            {fmtBRL(item.subtotal)}
                          </td>
                          <td className="px-2 py-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-blue-50 border-t-2 border-blue-100">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 font-semibold text-blue-700 text-right">
                          Total do Orçamento
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-blue-800 text-base">
                          {fmtBRL(valorTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConcluir}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-200 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Concluir Orçamento
            </button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Confirmar Orçamento</h3>
                <p className="text-sm text-slate-500">Revise os dados antes de salvar</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%]">
                  {clienteSelecionado?.nomeCompleto ??
                    clienteSelecionado?.razaoSocial ??
                    clienteSelecionado?.nomeFantasia}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Validade</span>
                <span className="font-semibold text-slate-800">{fmtDate(dataValidade)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Itens</span>
                <span className="font-semibold text-slate-800">{itens.length} produto(s)</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="font-semibold text-slate-700">Total</span>
                <span className="font-bold text-blue-700 text-base">{fmtBRL(valorTotal)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Confirmar e Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showClienteModal && (
        <ClienteSelectorModal
          onSelect={handleClienteSelect}
          onClose={() => setShowClienteModal(false)}
        />
      )}
      {showProdutoModal && (
        <ProdutoSelectorModal
          itensExistentes={saleItensForModal}
          onConfirm={handleProdutosConfirm}
          onClose={() => setShowProdutoModal(false)}
        />
      )}
    </>
  );
}
