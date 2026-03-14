import React, { useState } from 'react';
import {
  X,
  Pencil,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  Layers,
  Palette,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { EstoqueProdutoCompleto, EstoqueCor, EstoqueVariacao } from '../../types';
import { format } from '../../utils/format';

interface EstoqueDetalhesProps {
  produto: EstoqueProdutoCompleto;
  onClose: () => void;
  onEditProduto: () => void;
  onDelete: () => void;
}

const EstoqueDetalhes: React.FC<EstoqueDetalhesProps> = ({
  produto,
  onClose,
  onEditProduto,
  onDelete,
}) => {
  const {
    updateEstoqueCor,
    updateEstoqueVariacao,
    removeEstoqueCor,
    removeEstoqueVariacao,
    updateEstoqueSaldo,
    addEstoqueCor,
    addEstoqueVariacao,
  } = useAppContext();

  const [editingCorId, setEditingCorId] = useState<string | null>(null);
  const [editingCorValue, setEditingCorValue] = useState('');
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [editingVar, setEditingVar] = useState<{ nomeVariacao: string; valorUnitarioPadrao: string; descricao: string }>({ nomeVariacao: '', valorUnitarioPadrao: '', descricao: '' });
  const [editingSaldoId, setEditingSaldoId] = useState<string | null>(null);
  const [editingSaldoValue, setEditingSaldoValue] = useState('');

  const [addingCor, setAddingCor] = useState(false);
  const [novaCorValue, setNovaCorValue] = useState('');
  const [addingVar, setAddingVar] = useState(false);
  const [novaVar, setNovaVar] = useState({ nomeVariacao: '', valorUnitarioPadrao: '', descricao: '' });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'cor' | 'variacao' | 'produto'; id: string; label: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const handleSaveCor = async (cor: EstoqueCor) => {
    if (!editingCorValue.trim()) return;
    setLoading(true);
    try {
      await updateEstoqueCor(cor.id, editingCorValue.trim());
      setEditingCorId(null);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVariacao = async (variacao: EstoqueVariacao) => {
    if (!editingVar.nomeVariacao.trim()) return;
    setLoading(true);
    try {
      await updateEstoqueVariacao(
        variacao.id,
        editingVar.nomeVariacao.trim(),
        Number(editingVar.valorUnitarioPadrao) || 0,
        editingVar.descricao.trim() || undefined
      );
      setEditingVarId(null);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      if (confirmDelete.type === 'cor') {
        await removeEstoqueCor(confirmDelete.id);
      } else if (confirmDelete.type === 'variacao') {
        await removeEstoqueVariacao(confirmDelete.id);
      } else if (confirmDelete.type === 'produto') {
        await onDelete();
        return;
      }
      setConfirmDelete(null);
    } catch (err: any) {
      setConfirmDelete(null);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSaldo = async (saldoId: string) => {
    const qty = Number(editingSaldoValue);
    if (isNaN(qty) || qty < 0) return;
    setLoading(true);
    try {
      await updateEstoqueSaldo(saldoId, qty);
      setEditingSaldoId(null);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCor = async () => {
    if (!novaCorValue.trim()) return;
    setLoading(true);
    try {
      await addEstoqueCor(produto.id, novaCorValue.trim());
      setNovaCorValue('');
      setAddingCor(false);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariacao = async () => {
    if (!novaVar.nomeVariacao.trim()) return;
    setLoading(true);
    try {
      await addEstoqueVariacao(
        produto.id,
        novaVar.nomeVariacao.trim(),
        Number(novaVar.valorUnitarioPadrao) || 0,
        novaVar.descricao.trim() || undefined
      );
      setNovaVar({ nomeVariacao: '', valorUnitarioPadrao: '', descricao: '' });
      setAddingVar(false);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSaldo = (variacaoId: string, corId?: string) => {
    return produto.saldos.find(
      s => s.variacaoId === variacaoId && (corId ? s.corId === corId : !s.corId)
    );
  };

  const totalEmEstoque = produto.saldos.reduce((acc, s) => acc + s.quantidadeAtual, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{produto.nome}</h2>
            <p className="text-xs text-gray-500">
              {produto.temCor ? `${produto.cores.length} cores · ` : ''}{produto.variacoes.length} variacoes · {totalEmEstoque} un. total em estoque
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEditProduto}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Editar nome
            </button>
            <button
              onClick={() => setConfirmDelete({ type: 'produto', id: produto.id, label: produto.nome })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">{errorMsg}</p>
            </div>
          )}

          {produto.temCor && (
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Cores Cadastradas</h3>
                </div>
                <button
                  onClick={() => setAddingCor(true)}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar cor
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {produto.cores.map(cor => (
                  <div key={cor.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                    {editingCorId === cor.id ? (
                      <>
                        <input
                          autoFocus
                          type="text"
                          value={editingCorValue}
                          onChange={e => setEditingCorValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveCor(cor); if (e.key === 'Escape') setEditingCorId(null); }}
                          className="w-24 text-xs px-1 py-0.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <button onClick={() => handleSaveCor(cor)} disabled={loading} className="text-teal-600 hover:text-teal-700">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingCorId(null)} className="text-gray-400 hover:text-gray-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-gray-700">{cor.nomeCor}</span>
                        <button
                          onClick={() => { setEditingCorId(cor.id); setEditingCorValue(cor.nomeCor); }}
                          className="text-gray-400 hover:text-teal-600 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ type: 'cor', id: cor.id, label: cor.nomeCor })}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {addingCor && (
                  <div className="flex items-center gap-1.5 border border-teal-300 rounded-lg px-2.5 py-1.5 bg-teal-50">
                    <input
                      autoFocus
                      type="text"
                      value={novaCorValue}
                      onChange={e => setNovaCorValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddCor(); if (e.key === 'Escape') { setAddingCor(false); setNovaCorValue(''); } }}
                      placeholder="Nova cor..."
                      className="w-24 text-xs px-1 py-0.5 border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                    <button onClick={handleAddCor} disabled={loading} className="text-teal-600 hover:text-teal-700">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setAddingCor(false); setNovaCorValue(''); }} className="text-gray-400 hover:text-gray-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-gray-800">Variacoes Cadastradas</h3>
              </div>
              <button
                onClick={() => setAddingVar(true)}
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar variacao
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Variacao</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor Unitario</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descricao</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {produto.variacoes.map(variacao => (
                    <tr key={variacao.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      {editingVarId === variacao.id ? (
                        <>
                          <td className="py-2 px-3">
                            <input
                              autoFocus
                              type="text"
                              value={editingVar.nomeVariacao}
                              onChange={e => setEditingVar(prev => ({ ...prev, nomeVariacao: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={editingVar.valorUnitarioPadrao}
                              onChange={e => setEditingVar(prev => ({ ...prev, valorUnitarioPadrao: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingVar.descricao}
                              onChange={e => setEditingVar(prev => ({ ...prev, descricao: e.target.value }))}
                              className="w-full px-2 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleSaveVariacao(variacao)} disabled={loading} className="text-teal-600 hover:text-teal-700 p-1">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingVarId(null)} className="text-gray-400 hover:text-gray-500 p-1">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 px-3 font-medium text-gray-800">{variacao.nomeVariacao}</td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {variacao.valorUnitarioPadrao > 0
                              ? `R$ ${variacao.valorUnitarioPadrao.toFixed(2).replace('.', ',')}`
                              : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 text-xs">{variacao.descricao || <span className="text-gray-300">—</span>}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingVarId(variacao.id);
                                  setEditingVar({
                                    nomeVariacao: variacao.nomeVariacao,
                                    valorUnitarioPadrao: String(variacao.valorUnitarioPadrao),
                                    descricao: variacao.descricao || '',
                                  });
                                }}
                                className="p-1 hover:bg-gray-100 text-gray-400 hover:text-teal-600 rounded transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ type: 'variacao', id: variacao.id, label: variacao.nomeVariacao })}
                                className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}

                  {addingVar && (
                    <tr className="bg-teal-50 border-b border-teal-100">
                      <td className="py-2 px-3">
                        <input
                          autoFocus
                          type="text"
                          value={novaVar.nomeVariacao}
                          onChange={e => setNovaVar(prev => ({ ...prev, nomeVariacao: e.target.value }))}
                          placeholder="Ex: 18 Litros"
                          className="w-full px-2 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={novaVar.valorUnitarioPadrao}
                          onChange={e => setNovaVar(prev => ({ ...prev, valorUnitarioPadrao: e.target.value }))}
                          placeholder="R$"
                          className="w-full px-2 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={novaVar.descricao}
                          onChange={e => setNovaVar(prev => ({ ...prev, descricao: e.target.value }))}
                          placeholder="Descricao (opcional)"
                          className="w-full px-2 py-1 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <button onClick={handleAddVariacao} disabled={loading} className="text-teal-600 hover:text-teal-700 p-1">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setAddingVar(false); setNovaVar({ nomeVariacao: '', valorUnitarioPadrao: '', descricao: '' }); }} className="text-gray-400 hover:text-gray-500 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Estoque Atual</h3>

            {produto.temCor ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 rounded-tl-lg border border-gray-100">
                        Variacao / Cor
                      </th>
                      {produto.cores.map(cor => (
                        <th
                          key={cor.id}
                          className="text-center py-2 px-3 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100 whitespace-nowrap"
                        >
                          {cor.nomeCor}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {produto.variacoes.map(variacao => (
                      <tr key={variacao.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-gray-700 border border-gray-100 text-xs">
                          {variacao.nomeVariacao}
                        </td>
                        {produto.cores.map(cor => {
                          const saldo = getSaldo(variacao.id, cor.id);
                          if (!saldo) return (
                            <td key={cor.id} className="text-center py-2.5 px-3 border border-gray-100 text-gray-300">—</td>
                          );
                          return (
                            <td key={cor.id} className="text-center py-2 px-3 border border-gray-100">
                              {editingSaldoId === saldo.id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    autoFocus
                                    type="number"
                                    value={editingSaldoValue}
                                    onChange={e => setEditingSaldoValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveSaldo(saldo.id); if (e.key === 'Escape') setEditingSaldoId(null); }}
                                    min="0"
                                    className="w-16 text-center px-1 py-0.5 text-xs border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  />
                                  <button onClick={() => handleSaveSaldo(saldo.id)} disabled={loading} className="text-teal-600">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setEditingSaldoId(null)} className="text-gray-400">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditingSaldoId(saldo.id); setEditingSaldoValue(String(saldo.quantidadeAtual)); }}
                                  className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold transition-all hover:ring-2 hover:ring-teal-300 ${saldo.quantidadeAtual > 0 ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'}`}
                                >
                                  {saldo.quantidadeAtual}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Variacao</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produto.variacoes.map(variacao => {
                      const saldo = getSaldo(variacao.id);
                      return (
                        <tr key={variacao.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-gray-700">{variacao.nomeVariacao}</td>
                          <td className="py-2 px-3 text-center">
                            {saldo ? (
                              editingSaldoId === saldo.id ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    autoFocus
                                    type="number"
                                    value={editingSaldoValue}
                                    onChange={e => setEditingSaldoValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveSaldo(saldo.id); if (e.key === 'Escape') setEditingSaldoId(null); }}
                                    min="0"
                                    className="w-20 text-center px-2 py-1 text-sm border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  />
                                  <button onClick={() => handleSaveSaldo(saldo.id)} disabled={loading} className="text-teal-600">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditingSaldoId(null)} className="text-gray-400">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditingSaldoId(saldo.id); setEditingSaldoValue(String(saldo.quantidadeAtual)); }}
                                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold transition-all hover:ring-2 hover:ring-teal-300 ${saldo.quantidadeAtual > 0 ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'}`}
                                >
                                  {saldo.quantidadeAtual}
                                </button>
                              )
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs text-gray-400">Clique em um numero para editar a quantidade</p>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Confirmar exclusao</h3>
                <p className="text-xs text-gray-500">Esta acao nao pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Deseja excluir{' '}
              {confirmDelete.type === 'cor' ? 'a cor' : confirmDelete.type === 'variacao' ? 'a variacao' : 'o produto'}{' '}
              <strong>"{confirmDelete.label}"</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {loading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstoqueDetalhes;
