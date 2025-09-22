import React, { useState } from 'react';
import { X, DollarSign, FileText, CreditCard, Receipt, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Acerto } from '../../types';

interface CompanyPaymentNegotiationFormProps {
  acerto: Acerto;
  onSubmit: (paymentData: any) => void;
  onCancel: () => void;
}

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'cheque_disponivel', label: 'Usar Cheques Disponíveis' },
  { value: 'cheque_proprio', label: 'Cheques Próprios (Criar)' },
  { value: 'boleto', label: 'Boletos (Criar)' },
  { value: 'transferencia', label: 'Transferência' }
];

export function CompanyPaymentNegotiationForm({ acerto, onSubmit, onCancel }: CompanyPaymentNegotiationFormProps) {
  const { checks, createCheck, createBoleto } = useAppContext();
  
  const [formData, setFormData] = useState({
    paymentAmount: acerto.pendingAmount,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'dinheiro' as const,
    paymentInstallments: 1,
    paymentInstallmentValue: acerto.pendingAmount,
    paymentInterval: 30,
    observations: '',
    selectedChecks: [] as string[],
    ownChecks: [] as any[],
    boletos: [] as any[]
  });

  // Obter cheques disponíveis da empresa
  const availableChecks = checks.filter(check => 
    check.client === (acerto.companyName || acerto.clientName) && 
    check.status === 'pendente' && 
    !check.usedInDebt
  );

  // Auto-calculate installment value
  React.useEffect(() => {
    if (formData.paymentInstallments > 1) {
      const installmentValue = formData.paymentAmount / formData.paymentInstallments;
      setFormData(prev => ({ ...prev, paymentInstallmentValue: installmentValue }));
    } else {
      setFormData(prev => ({ ...prev, paymentInstallmentValue: formData.paymentAmount }));
    }
  }, [formData.paymentAmount, formData.paymentInstallments]);

  // Auto-generate own checks when method is selected
  React.useEffect(() => {
    if (formData.paymentMethod === 'cheque_proprio' && formData.paymentInstallments > 0) {
      const newOwnChecks = [];
      for (let i = 1; i <= formData.paymentInstallments; i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (i * formData.paymentInterval));
        
        newOwnChecks.push({
          client: acerto.companyName || acerto.clientName,
          value: formData.paymentInstallmentValue,
          dueDate: dueDate.toISOString().split('T')[0],
          isOwnCheck: true,
          isCompanyPayable: true,
          companyName: acerto.companyName || acerto.clientName,
          installmentNumber: i,
          totalInstallments: formData.paymentInstallments,
          observations: `Cheque próprio para acerto de dívida - Parcela ${i}/${formData.paymentInstallments}`
        });
      }
      setFormData(prev => ({ ...prev, ownChecks: newOwnChecks }));
    }
  }, [formData.paymentMethod, formData.paymentInstallments, formData.paymentInstallmentValue, formData.paymentInterval, acerto]);

  // Auto-generate boletos when method is selected
  React.useEffect(() => {
    if (formData.paymentMethod === 'boleto' && formData.paymentInstallments > 0) {
      const newBoletos = [];
      for (let i = 1; i <= formData.paymentInstallments; i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (i * formData.paymentInterval));
        
        newBoletos.push({
          client: acerto.companyName || acerto.clientName,
          value: formData.paymentInstallmentValue,
          dueDate: dueDate.toISOString().split('T')[0],
          isCompanyPayable: true,
          companyName: acerto.companyName || acerto.clientName,
          installmentNumber: i,
          totalInstallments: formData.paymentInstallments,
          observations: `Boleto para acerto de dívida - Parcela ${i}/${formData.paymentInstallments}`
        });
      }
      setFormData(prev => ({ ...prev, boletos: newBoletos }));
    }
  }, [formData.paymentMethod, formData.paymentInstallments, formData.paymentInstallmentValue, formData.paymentInterval, acerto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paymentAmount || formData.paymentAmount <= 0) {
      alert('O valor do pagamento deve ser maior que zero.');
      return;
    }
    
    if (formData.paymentAmount > acerto.pendingAmount) {
      alert('O valor do pagamento não pode ser maior que o valor pendente.');
      return;
    }

    try {
      // Criar cheques próprios se necessário
      if (formData.paymentMethod === 'cheque_proprio' && formData.ownChecks.length > 0) {
        for (const checkData of formData.ownChecks) {
          await createCheck(checkData);
        }
      }

      // Criar boletos se necessário
      if (formData.paymentMethod === 'boleto' && formData.boletos.length > 0) {
        for (const boletoData of formData.boletos) {
          await createBoleto(boletoData);
        }
      }

      // Marcar cheques selecionados como usados
      if (formData.paymentMethod === 'cheque_disponivel' && formData.selectedChecks.length > 0) {
        // TODO: Implementar marcação de cheques como usados
      }

      // Calculate new amounts
      const newPaidAmount = acerto.paidAmount + formData.paymentAmount;
      const newPendingAmount = acerto.totalAmount - newPaidAmount;
      const newStatus = newPendingAmount <= 0 ? 'pago' : 'parcial';
      
      const paymentData = {
        paidAmount: newPaidAmount,
        pendingAmount: Math.max(0, newPendingAmount),
        status: newStatus as Acerto['status'],
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        paymentInstallments: formData.paymentInstallments > 1 ? formData.paymentInstallments : undefined,
        paymentInstallmentValue: formData.paymentInstallments > 1 ? formData.paymentInstallmentValue : undefined,
        paymentInterval: formData.paymentInstallments > 1 ? formData.paymentInterval : undefined,
        observations: formData.observations || acerto.observations,
        availableChecks: formData.selectedChecks
      };
      
      onSubmit(paymentData);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const addOwnCheck = () => {
    const newCheck = {
      client: acerto.companyName || acerto.clientName,
      value: 0,
      dueDate: new Date().toISOString().split('T')[0],
      isOwnCheck: true,
      isCompanyPayable: true,
      companyName: acerto.companyName || acerto.clientName,
      installmentNumber: formData.ownChecks.length + 1,
      totalInstallments: formData.paymentInstallments,
      observations: `Cheque próprio para acerto de dívida`
    };
    
    setFormData(prev => ({ ...prev, ownChecks: [...prev.ownChecks, newCheck] }));
  };

  const removeOwnCheck = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      ownChecks: prev.ownChecks.filter((_, i) => i !== index) 
    }));
  };

  const updateOwnCheck = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      ownChecks: prev.ownChecks.map((check, i) => 
        i === index ? { ...check, [field]: value } : check
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm modal-overlay">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Negociar Pagamento</h2>
                <p className="text-slate-600">Empresa: {acerto.companyName || acerto.clientName}</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Informações do Acerto */}
          <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200">
            <h3 className="text-xl font-bold text-red-900 mb-4">Situação Atual do Acerto</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-red-600 font-semibold">Total</p>
                <p className="text-xl font-bold text-red-800">
                  R$ {acerto.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-red-600 font-semibold">Já Pago</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {acerto.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-red-600 font-semibold">Pendente</p>
                <p className="text-xl font-bold text-orange-600">
                  R$ {acerto.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Valor do Pagamento *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={acerto.pendingAmount}
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentAmount: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data do Pagamento *</label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Forma de Pagamento *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="input-field"
                  required
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.paymentMethod === 'cheque_proprio' || formData.paymentMethod === 'boleto') && (
                <>
                  <div className="form-group">
                    <label className="form-label">Número de Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={formData.paymentInstallments}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentInstallments: parseInt(e.target.value) || 1 }))}
                      className="input-field"
                      placeholder="1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valor da Parcela</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.paymentInstallmentValue}
                      className="input-field bg-gray-50"
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Intervalo (dias)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.paymentInterval}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentInterval: parseInt(e.target.value) || 30 }))}
                      className="input-field"
                      placeholder="30"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Cheques Disponíveis */}
            {formData.paymentMethod === 'cheque_disponivel' && (
              <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                <h3 className="text-xl font-bold text-yellow-900 mb-4">Cheques Disponíveis</h3>
                {availableChecks.length > 0 ? (
                  <div className="space-y-3">
                    {availableChecks.map(check => (
                      <label key={check.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-yellow-100 cursor-pointer hover:bg-yellow-50">
                        <input
                          type="checkbox"
                          checked={formData.selectedChecks.includes(check.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ 
                                ...prev, 
                                selectedChecks: [...prev.selectedChecks, check.id] 
                              }));
                            } else {
                              setFormData(prev => ({ 
                                ...prev, 
                                selectedChecks: prev.selectedChecks.filter(id => id !== check.id) 
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-yellow-900">
                                Cheque #{check.installmentNumber || 1}
                              </p>
                              <p className="text-sm text-yellow-700">
                                Vencimento: {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <span className="font-bold text-yellow-600">
                              R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                      <p className="text-blue-800 font-semibold">
                        Total Selecionado: R$ {availableChecks
                          .filter(c => formData.selectedChecks.includes(c.id))
                          .reduce((sum, c) => sum + c.value, 0)
                          .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-yellow-300" />
                    <p className="text-yellow-600 font-medium">Nenhum cheque disponível</p>
                  </div>
                )}
              </div>
            )}

            {/* Cheques Próprios */}
            {formData.paymentMethod === 'cheque_proprio' && (
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-blue-900">Cheques Próprios a Criar</h3>
                  <button
                    type="button"
                    onClick={addOwnCheck}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Cheque
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.ownChecks.map((check, index) => (
                    <div key={index} className="p-4 bg-white rounded-xl border border-blue-100">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-semibold text-blue-900">Cheque {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeOwnCheck(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="form-label">Valor</label>
                          <input
                            type="number"
                            step="0.01"
                            value={check.value}
                            onChange={(e) => updateOwnCheck(index, 'value', parseFloat(e.target.value) || 0)}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="form-label">Vencimento</label>
                          <input
                            type="date"
                            value={check.dueDate}
                            onChange={(e) => updateOwnCheck(index, 'dueDate', e.target.value)}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="form-label">Observações</label>
                          <input
                            type="text"
                            value={check.observations}
                            onChange={(e) => updateOwnCheck(index, 'observations', e.target.value)}
                            className="input-field"
                            placeholder="Observações..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Boletos */}
            {formData.paymentMethod === 'boleto' && (
              <div className="p-6 bg-cyan-50 rounded-2xl border border-cyan-200">
                <h3 className="text-xl font-bold text-cyan-900 mb-4">Boletos a Criar</h3>
                
                <div className="space-y-4">
                  {formData.boletos.map((boleto, index) => (
                    <div key={index} className="p-4 bg-white rounded-xl border border-cyan-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="font-semibold text-cyan-900">Boleto {index + 1}</p>
                          <p className="text-sm text-cyan-700">
                            Valor: R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-cyan-700">
                            Vencimento: {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-cyan-700">
                            Parcela: {boleto.installmentNumber}/{boleto.totalInstallments}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Observações sobre a Negociação</label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                className="input-field"
                rows={3}
                placeholder="Detalhes da negociação, acordos feitos, etc..."
              />
            </div>

            {/* Preview do Resultado */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 modern-shadow-xl">
              <h3 className="text-xl font-black text-green-800 mb-4">Resultado Após Pagamento</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <span className="text-green-600 font-semibold block mb-1">Novo Pago:</span>
                  <p className="text-2xl font-black text-green-600">
                    R$ {(acerto.paidAmount + formData.paymentAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-green-600 font-semibold block mb-1">Novo Pendente:</span>
                  <p className="text-2xl font-black text-orange-600">
                    R$ {Math.max(0, acerto.pendingAmount - formData.paymentAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-green-600 font-semibold block mb-1">Novo Status:</span>
                  <p className="text-lg font-bold text-green-800">
                    {(acerto.paidAmount + formData.paymentAmount) >= acerto.totalAmount ? 'PAGO' : 'PARCIAL'}
                  </p>
                </div>
              </div>
              
              {formData.paymentMethod === 'cheque_proprio' && formData.ownChecks.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800 font-semibold text-center">
                    📋 Serão criados {formData.ownChecks.length} cheques próprios na aba "Cheques"
                  </p>
                </div>
              )}
              
              {formData.paymentMethod === 'boleto' && formData.boletos.length > 0 && (
                <div className="mt-4 p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                  <p className="text-sm text-cyan-800 font-semibold text-center">
                    📋 Serão criados {formData.boletos.length} boletos na aba "Boletos"
                  </p>
                </div>
              )}

              {formData.paymentMethod === 'cheque_disponivel' && formData.selectedChecks.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-semibold text-center">
                    📋 {formData.selectedChecks.length} cheque(s) serão marcados como usados para esta dívida
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Confirmar Negociação
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}