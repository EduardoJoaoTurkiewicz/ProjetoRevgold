import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Plus,
  Package,
  Layers,
  Palette,
  ClipboardList,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { EstoqueProdutoCompleto, EstoqueCor } from '../../types';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface ProducaoFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemProduzido {
  produtoId: string;
  variacaoId: string;
  corId?: string;
  quantidade: number;
}

interface VariacaoSelecionada {
  variacaoId: string;
  quantidade: number;
}

interface DistribuicaoCor {
  corId: string;
  quantidade: number;
}

const STEPS = [
  { id: 1, label: 'Dados Básicos', icon: ClipboardList },
  { id: 2, label: 'Produtos', icon: Package },
  { id: 3, label: 'Variações', icon: Layers },
  { id: 4, label: 'Cores', icon: Palette },
  { id: 5, label: 'Confirmar', icon: Check },
];

export function ProducaoForm({ onClose, onSuccess }: ProducaoFormProps) {
  const {
    estoqueProdutos,
    loadEstoqueData,
    gerarProximoLote,
    createProducao,
  } = useAppContext();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [lotePreview, setLotePreview] = useState('');
  const [loadingLote, setLoadingLote] = useState(true);

  const [produtoSearch, setProdutoSearch] = useState('');
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [selectedProdutos, setSelectedProdutos] = useState<EstoqueProdutoCompleto[]>([]);

  const [variacoesSelecionadas, setVariacoesSelecionadas] = useState<
    Record<string, VariacaoSelecionada[]>
  >({});

  const [distribuicaoCores, setDistribuicaoCores] = useState<
    Record<string, Record<string, DistribuicaoCor[]>>
  >({});

  const [novaCorNome, setNovaCorNome] = useState<Record<string, string>>({});
  const [addingCor, setAddingCor] = useState<Record<string, boolean>>({});

  const [localProdutos, setLocalProdutos] = useState<EstoqueProdutoCompleto[]>(estoqueProdutos);

  useEffect(() => {
    setLocalProdutos(estoqueProdutos);
  }, [estoqueProdutos]);

  useEffect(() => {
    const load = async () => {
      setLoadingLote(true);
      try {
        const lote = await gerarProximoLote(new Date());
        setLotePreview(lote);
      } catch {
        setLotePreview('MT-' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '-0001');
      } finally {
        setLoadingLote(false);
      }
    };
    load();
  }, []);

  const produtosFiltrados = useMemo(() => {
    if (!produtoSearch.trim()) return localProdutos;
    const q = produtoSearch.toLowerCase();
    return localProdutos.filter(p => p.nome.toLowerCase().includes(q));
  }, [localProdutos, produtoSearch]);

  const produtosComCor = useMemo(() => {
    return selectedProdutos.filter(p => p.temCor);
  }, [selectedProdutos]);

  const hasCores = produtosComCor.length > 0;

  const toggleProduto = (produto: EstoqueProdutoCompleto) => {
    setSelectedProdutos(prev => {
      const exists = prev.find(p => p.id === produto.id);
      if (exists) {
        return prev.filter(p => p.id !== produto.id);
      }
      return [...prev, produto];
    });
  };

  const setVariacaoQtd = (produtoId: string, variacaoId: string, quantidade: number) => {
    setVariacoesSelecionadas(prev => {
      const list = prev[produtoId] || [];
      const exists = list.find(v => v.variacaoId === variacaoId);
      if (exists) {
        return {
          ...prev,
          [produtoId]: list.map(v =>
            v.variacaoId === variacaoId ? { ...v, quantidade } : v
          ),
        };
      }
      return { ...prev, [produtoId]: [...list, { variacaoId, quantidade }] };
    });
  };

  const toggleVariacaoCheck = (produtoId: string, variacaoId: string, checked: boolean) => {
    setVariacoesSelecionadas(prev => {
      const list = prev[produtoId] || [];
      if (!checked) {
        return { ...prev, [produtoId]: list.filter(v => v.variacaoId !== variacaoId) };
      }
      const exists = list.find(v => v.variacaoId === variacaoId);
      if (exists) return prev;
      return { ...prev, [produtoId]: [...list, { variacaoId, quantidade: 0 }] };
    });
  };

  const setCorQtd = (produtoId: string, variacaoId: string, corId: string, quantidade: number) => {
    setDistribuicaoCores(prev => {
      const varMap = prev[produtoId] || {};
      const corList = varMap[variacaoId] || [];
      const exists = corList.find(c => c.corId === corId);
      const updated = exists
        ? corList.map(c => (c.corId === corId ? { ...c, quantidade } : c))
        : [...corList, { corId, quantidade }];
      return { ...prev, [produtoId]: { ...varMap, [variacaoId]: updated } };
    });
  };

  const getCorQtd = (produtoId: string, variacaoId: string, corId: string): number => {
    return distribuicaoCores[produtoId]?.[variacaoId]?.find(c => c.corId === corId)?.quantidade ?? 0;
  };

  const handleAddCor = async (produtoId: string) => {
    const nome = (novaCorNome[produtoId] || '').trim();
    if (!nome) return;
    setAddingCor(prev => ({ ...prev, [produtoId]: true }));
    try {
      const { data: cor, error } = await supabase
        .from('estoque_cores')
        .insert({ produto_id: produtoId, nome_cor: nome })
        .select()
        .single();
      if (error) throw error;

      const { data: variacoes } = await supabase
        .from('estoque_variacoes')
        .select('id')
        .eq('produto_id', produtoId);
      if (variacoes && variacoes.length > 0) {
        await supabase.from('estoque_saldos').insert(
          variacoes.map(v => ({
            produto_id: produtoId,
            variacao_id: v.id,
            cor_id: cor.id,
            quantidade_atual: 0,
          }))
        );
      }

      await loadEstoqueData();
      setNovaCorNome(prev => ({ ...prev, [produtoId]: '' }));
      toast.success(`Cor "${nome}" adicionada!`);
    } catch (err: any) {
      toast.error('Erro ao adicionar cor: ' + err.message);
    } finally {
      setAddingCor(prev => ({ ...prev, [produtoId]: false }));
    }
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!titulo.trim()) return 'Informe o título da produção.';
    }
    if (step === 2) {
      if (selectedProdutos.length === 0) return 'Selecione ao menos um produto.';
    }
    if (step === 3) {
      for (const produto of selectedProdutos) {
        const vars = variacoesSelecionadas[produto.id] || [];
        if (vars.length === 0) return `Selecione ao menos uma variação para "${produto.nome}".`;
        for (const v of vars) {
          if (v.quantidade <= 0) return `Informe a quantidade da variação em "${produto.nome}".`;
        }
      }
    }
    if (step === 4 && hasCores) {
      for (const produto of produtosComCor) {
        const vars = variacoesSelecionadas[produto.id] || [];
        for (const varItem of vars) {
          const totalCores = produto.cores.reduce(
            (sum, cor) => sum + getCorQtd(produto.id, varItem.variacaoId, cor.id),
            0
          );
          if (totalCores !== varItem.quantidade) {
            const varNome = produto.variacoes.find(v => v.id === varItem.variacaoId)?.nomeVariacao || '';
            return `A distribuição de cores da variação "${varNome}" em "${produto.nome}" deve somar ${varItem.quantidade}. Atual: ${totalCores}.`;
          }
        }
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    if (step === 3 && !hasCores) {
      setStep(5);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step === 5 && !hasCores) {
      setStep(3);
    } else {
      setStep(s => s - 1);
    }
  };

  const buildItens = (): ItemProduzido[] => {
    const itens: ItemProduzido[] = [];
    for (const produto of selectedProdutos) {
      const vars = variacoesSelecionadas[produto.id] || [];
      for (const varItem of vars) {
        if (produto.temCor && produto.cores.length > 0) {
          for (const cor of produto.cores) {
            const qtd = getCorQtd(produto.id, varItem.variacaoId, cor.id);
            if (qtd > 0) {
              itens.push({ produtoId: produto.id, variacaoId: varItem.variacaoId, corId: cor.id, quantidade: qtd });
            }
          }
        } else {
          itens.push({ produtoId: produto.id, variacaoId: varItem.variacaoId, quantidade: varItem.quantidade });
        }
      }
    }
    return itens;
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const lote = await gerarProximoLote(new Date());
      const itens = buildItens();
      await createProducao(titulo.trim(), lote, new Date(), itens);
      toast.success('Produção registrada com sucesso!');
      onSuccess();
    } catch (err: any) {
      toast.error('Erro ao salvar produção: ' + err.message);
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  const activeSteps = hasCores ? STEPS : STEPS.filter(s => s.id !== 4);

  const getStepIndex = (stepId: number) => activeSteps.findIndex(s => s.id === stepId);
  const currentStepIndex = getStepIndex(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Nova Produção</h2>
            <p className="text-orange-100 text-sm font-semibold mt-1">
              Passo {currentStepIndex + 1} de {activeSteps.length}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-orange-100 hover:bg-white/20 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-8 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            {activeSteps.map((s, idx) => {
              const Icon = s.icon;
              const isCurrent = s.id === step;
              const isDone = getStepIndex(step) > idx;
              return (
                <React.Fragment key={s.id}>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    isCurrent ? 'bg-orange-500 text-white' :
                    isDone ? 'bg-emerald-500 text-white' :
                    'bg-slate-200 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {idx < activeSteps.length - 1 && (
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDone ? 'text-emerald-400' : 'text-slate-300'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Título da Produção *</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex.: Produção Emborrachada – Março 2026"
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-orange-400 transition-colors"
                />
              </div>
              <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Lote (gerado automaticamente)</p>
                {loadingLote ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-mono">Gerando...</span>
                  </div>
                ) : (
                  <p className="font-mono text-xl font-black text-orange-700">{lotePreview}</p>
                )}
              </div>
              <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data de Fabricação</p>
                  <p className="font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Validade (2 anos)</p>
                  <p className="font-bold text-slate-700">
                    {(() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 2);
                      return d.toLocaleDateString('pt-BR');
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowProdutoModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Selecionar Produtos
                </button>
                <span className="text-sm text-slate-500 font-semibold">
                  {selectedProdutos.length} produto(s) selecionado(s)
                </span>
              </div>

              {selectedProdutos.length > 0 ? (
                <div className="space-y-2">
                  {selectedProdutos.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3">
                      <div>
                        <p className="font-bold text-slate-800">{p.nome}</p>
                        <p className="text-xs text-slate-500">
                          {p.variacoes.length} variação(ões) · {p.temCor ? `${p.cores.length} cor(es)` : 'Sem cor'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleProduto(p)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold">Nenhum produto selecionado</p>
                </div>
              )}

              {showProdutoModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-800">Selecionar Produtos</h3>
                      <button onClick={() => setShowProdutoModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-4 border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={produtoSearch}
                          onChange={e => setProdutoSearch(e.target.value)}
                          placeholder="Buscar produto..."
                          className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-400 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {produtosFiltrados.map(p => {
                        const isSelected = selectedProdutos.some(sp => sp.id === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => toggleProduto(p)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? 'border-orange-400 bg-orange-50'
                                : 'border-slate-200 hover:border-orange-200 hover:bg-orange-50/50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{p.nome}</p>
                              <p className="text-xs text-slate-500">{p.variacoes.length} variação(ões)</p>
                            </div>
                          </button>
                        );
                      })}
                      {produtosFiltrados.length === 0 && (
                        <p className="text-center text-slate-400 py-8 font-semibold">Nenhum produto encontrado</p>
                      )}
                    </div>
                    <div className="p-4 border-t border-slate-100">
                      <button
                        onClick={() => setShowProdutoModal(false)}
                        className="w-full py-3 bg-orange-500 text-white rounded-xl font-black hover:bg-orange-600 transition-colors"
                      >
                        Concluir ({selectedProdutos.length} selecionado(s))
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {selectedProdutos.map(produto => (
                <div key={produto.id} className="border-2 border-slate-100 rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                    <p className="font-black text-slate-800">{produto.nome}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {produto.variacoes.map(variacao => {
                      const list = variacoesSelecionadas[produto.id] || [];
                      const sel = list.find(v => v.variacaoId === variacao.id);
                      const isChecked = !!sel;
                      return (
                        <div key={variacao.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isChecked ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}>
                          <button
                            onClick={() => toggleVariacaoCheck(produto.id, variacao.id, !isChecked)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isChecked ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}
                          >
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className="flex-1 font-semibold text-slate-700">{variacao.nomeVariacao}</span>
                          {isChecked && (
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-slate-500 font-semibold">Qtd:</label>
                              <input
                                type="number"
                                min={1}
                                value={sel?.quantidade || ''}
                                onChange={e => setVariacaoQtd(produto.id, variacao.id, Number(e.target.value))}
                                className="w-24 border-2 border-orange-200 rounded-lg px-2 py-1 text-center font-bold text-slate-800 focus:outline-none focus:border-orange-400 text-sm"
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {produto.variacoes.length === 0 && (
                      <p className="text-sm text-slate-400 italic">Nenhuma variação cadastrada</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 4 && hasCores && (
            <div className="space-y-8">
              {produtosComCor.map(produto => {
                const vars = variacoesSelecionadas[produto.id] || [];
                return (
                  <div key={produto.id} className="border-2 border-slate-100 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <p className="font-black text-slate-800">{produto.nome}</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={novaCorNome[produto.id] || ''}
                          onChange={e => setNovaCorNome(prev => ({ ...prev, [produto.id]: e.target.value }))}
                          placeholder="Nova cor..."
                          className="text-xs border-2 border-slate-200 rounded-lg px-2 py-1 font-semibold focus:outline-none focus:border-orange-400 w-28"
                          onKeyDown={e => { if (e.key === 'Enter') handleAddCor(produto.id); }}
                        />
                        <button
                          onClick={() => handleAddCor(produto.id)}
                          disabled={addingCor[produto.id]}
                          className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                          {addingCor[produto.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Adicionar
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-6">
                      {vars.map(varItem => {
                        const varNome = produto.variacoes.find(v => v.id === varItem.variacaoId)?.nomeVariacao || '';
                        const totalCores = produto.cores.reduce(
                          (sum, cor) => sum + getCorQtd(produto.id, varItem.variacaoId, cor.id),
                          0
                        );
                        const restante = varItem.quantidade - totalCores;
                        return (
                          <div key={varItem.variacaoId}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-slate-700 text-sm">{varNome}</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  restante === 0 ? 'bg-emerald-100 text-emerald-700' :
                                  restante > 0 ? 'bg-orange-100 text-orange-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {restante > 0 ? `Faltam ${restante}` : restante < 0 ? `Excesso ${Math.abs(restante)}` : 'OK'}
                                </span>
                                <span className="text-xs text-slate-500 font-semibold">Total: {varItem.quantidade}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {produto.cores.map(cor => (
                                <div key={cor.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2">
                                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex-shrink-0" />
                                  <span className="flex-1 text-sm font-semibold text-slate-700">{cor.nomeCor}</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={getCorQtd(produto.id, varItem.variacaoId, cor.id) || ''}
                                    onChange={e => setCorQtd(produto.id, varItem.variacaoId, cor.id, Number(e.target.value))}
                                    className="w-20 border-2 border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-slate-800 focus:outline-none focus:border-orange-400 text-sm"
                                    placeholder="0"
                                  />
                                </div>
                              ))}
                              {produto.cores.length === 0 && (
                                <p className="text-xs text-slate-400 italic">Nenhuma cor cadastrada. Adicione acima.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-100 rounded-2xl p-5">
                <h3 className="font-black text-orange-800 text-lg mb-4">Resumo da Produção</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-bold text-orange-600 uppercase">Título</p>
                    <p className="font-bold text-slate-800">{titulo}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-600 uppercase">Lote</p>
                    <p className="font-mono font-black text-orange-700">{lotePreview}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-600 uppercase">Fabricação</p>
                    <p className="font-bold text-slate-800">{new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-600 uppercase">Validade</p>
                    <p className="font-bold text-slate-800">
                      {(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 2); return d.toLocaleDateString('pt-BR'); })()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {buildItens().map((item, idx) => {
                  const produto = selectedProdutos.find(p => p.id === item.produtoId);
                  const variacao = produto?.variacoes.find(v => v.id === item.variacaoId);
                  const cor = produto?.cores.find(c => c.id === item.corId);
                  return (
                    <div key={idx} className="flex items-center justify-between bg-white border-2 border-slate-100 rounded-xl px-4 py-3">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{produto?.nome}</p>
                        <p className="text-xs text-slate-500">
                          {variacao?.nomeVariacao}{cor ? ` · ${cor.nomeCor}` : ''}
                        </p>
                      </div>
                      <span className="font-black text-orange-600 text-lg">{item.quantidade}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-amber-800">
                  Ao confirmar, o estoque será atualizado automaticamente com as quantidades produzidas.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>

          {step < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-black hover:bg-orange-600 transition-colors"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Concluir Produção
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Confirmar Produção</h3>
              <p className="text-slate-500 font-semibold text-sm">
                Deseja realmente concluir a produção? O estoque será atualizado automaticamente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
