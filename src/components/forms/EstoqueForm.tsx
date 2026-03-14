import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Package } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { EstoqueProdutoCompleto } from '../../types';

interface VariacaoInput {
  id: string;
  nomeVariacao: string;
  valorUnitarioPadrao: string;
  descricao: string;
}

interface EstoqueFormProps {
  produto?: EstoqueProdutoCompleto;
  onClose: () => void;
  onSuccess: () => void;
}

const EstoqueForm: React.FC<EstoqueFormProps> = ({ produto, onClose, onSuccess }) => {
  const { createEstoqueProduto, updateEstoqueProduto } = useAppContext();
  const isEditing = !!produto;

  const [nome, setNome] = useState(produto?.nome || '');
  const [descricao, setDescricao] = useState(produto?.descricao || '');
  const [semCor, setSemCor] = useState(!produto ? false : !produto.temCor);
  const [cores, setCores] = useState<string[]>(
    produto?.temCor && produto.cores.length > 0
      ? produto.cores.map(c => c.nomeCor)
      : ['']
  );
  const [variacoes, setVariacoes] = useState<VariacaoInput[]>(
    produto && produto.variacoes.length > 0
      ? produto.variacoes.map(v => ({
          id: v.id,
          nomeVariacao: v.nomeVariacao,
          valorUnitarioPadrao: String(v.valorUnitarioPadrao),
          descricao: v.descricao || '',
        }))
      : [{ id: crypto.randomUUID(), nomeVariacao: '', valorUnitarioPadrao: '', descricao: '' }]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = 'Nome do produto e obrigatorio';
    if (!semCor && cores.filter(c => c.trim()).length === 0) {
      newErrors.cores = 'Adicione pelo menos uma cor ou marque "Nao se aplica"';
    }
    const variacoesValidas = variacoes.filter(v => v.nomeVariacao.trim());
    if (variacoesValidas.length === 0) {
      newErrors.variacoes = 'Adicione pelo menos uma variacao';
    }
    variacoes.forEach((v, i) => {
      if (v.nomeVariacao.trim() && (isNaN(Number(v.valorUnitarioPadrao)) || v.valorUnitarioPadrao === '')) {
        newErrors[`variacao_valor_${i}`] = 'Valor invalido';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const coresValidas = semCor ? [] : cores.filter(c => c.trim());
      const variacoesValidas = variacoes
        .filter(v => v.nomeVariacao.trim())
        .map(v => ({
          nomeVariacao: v.nomeVariacao.trim(),
          valorUnitarioPadrao: Number(v.valorUnitarioPadrao) || 0,
          descricao: v.descricao.trim() || undefined,
        }));

      if (isEditing) {
        await updateEstoqueProduto(produto!.id, nome.trim(), descricao.trim() || undefined);
      } else {
        await createEstoqueProduto(
          nome.trim(),
          descricao.trim() || undefined,
          !semCor,
          coresValidas,
          variacoesValidas
        );
      }
      onSuccess();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Erro ao salvar produto' });
    } finally {
      setSubmitting(false);
    }
  };

  const addCor = () => setCores(prev => [...prev, '']);
  const removeCor = (index: number) => {
    if (cores.length <= 1) return;
    setCores(prev => prev.filter((_, i) => i !== index));
  };
  const updateCor = (index: number, value: string) => {
    setCores(prev => prev.map((c, i) => (i === index ? value : c)));
  };

  const addVariacao = () =>
    setVariacoes(prev => [
      ...prev,
      { id: crypto.randomUUID(), nomeVariacao: '', valorUnitarioPadrao: '', descricao: '' },
    ]);
  const removeVariacao = (id: string) => {
    if (variacoes.length <= 1) return;
    setVariacoes(prev => prev.filter(v => v.id !== id));
  };
  const updateVariacao = (id: string, field: keyof VariacaoInput, value: string) => {
    setVariacoes(prev => prev.map(v => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const coresValidas = semCor ? 0 : cores.filter(c => c.trim()).length;
  const variacoesValidas = variacoes.filter(v => v.nomeVariacao.trim()).length;
  const totalSaldos = !semCor && coresValidas > 0 ? variacoesValidas * coresValidas : variacoesValidas;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEditing ? 'Atualize nome e descricao' : 'Cadastre um produto no estoque'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome do Produto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Tinta Emborrachada, Lixa, Selador..."
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.nome ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm`}
            />
            {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descricao <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descricao adicional do produto..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm resize-none"
            />
          </div>

          {!isEditing && (
            <>
              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">Cores</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={semCor}
                      onChange={e => setSemCor(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs text-gray-600">Nao se aplica</span>
                  </label>
                </div>

                {!semCor && (
                  <div className="space-y-2">
                    {cores.map((cor, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cor}
                          onChange={e => updateCor(index, e.target.value)}
                          placeholder={`Cor ${index + 1} (Ex: Vermelha, Azul...)`}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                        {cores.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCor(index)}
                            className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCor}
                      className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar cor
                    </button>
                    {errors.cores && <p className="text-xs text-red-500">{errors.cores}</p>}
                  </div>
                )}
                {semCor && (
                  <p className="text-xs text-gray-400 italic">Produto sem variacao de cor (ex: lixas, solventes)</p>
                )}
              </div>

              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Variacoes <span className="text-red-500">*</span>
                </h3>
                <div className="space-y-3">
                  {variacoes.map((variacao, index) => (
                    <div key={variacao.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Variacao {index + 1}</span>
                        {variacoes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariacao(variacao.id)}
                            className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            value={variacao.nomeVariacao}
                            onChange={e => updateVariacao(variacao.id, 'nomeVariacao', e.target.value)}
                            placeholder="Ex: 18 Litros, 25 KG..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={variacao.valorUnitarioPadrao}
                            onChange={e => updateVariacao(variacao.id, 'valorUnitarioPadrao', e.target.value)}
                            placeholder="Valor unitario (R$)"
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-2 rounded-lg border ${errors[`variacao_valor_${index}`] ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white`}
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={variacao.descricao}
                        onChange={e => updateVariacao(variacao.id, 'descricao', e.target.value)}
                        placeholder="Descricao da variacao (opcional)"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addVariacao}
                    className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar variacao
                  </button>
                  {errors.variacoes && <p className="text-xs text-red-500">{errors.variacoes}</p>}
                </div>
              </div>

              {variacoesValidas > 0 && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-teal-700">
                    Serao criados <strong>{totalSaldos}</strong> registro{totalSaldos !== 1 ? 's' : ''} de saldo zerado
                    {!semCor && coresValidas > 0 ? ` (${variacoesValidas} variacoes x ${coresValidas} cores)` : ` (${variacoesValidas} variacoes)`}
                  </p>
                </div>
              )}
            </>
          )}

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-xl hover:from-teal-700 hover:to-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
            >
              {submitting ? 'Salvando...' : isEditing ? 'Salvar Alteracoes' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EstoqueForm;
