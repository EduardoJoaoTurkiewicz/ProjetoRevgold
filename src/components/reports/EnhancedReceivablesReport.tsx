import React, { useState, useMemo } from 'react';
import { Receipt, X, Eye, DollarSign, Calendar, CreditCard, FileText, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface ReceivableMovement {
  date: string;
  type: 'received' | 'anticipated' | 'used_for_debt' | 'pending';
  paymentMethod: string;
  amount: number;
  originalAmount?: number;
  fee?: number;
  netAmount?: number;
  description: string;
  relatedTo?: string;
  installmentInfo?: string;
}

interface SaleReceivable {
  saleId: string;
  client: string;
  saleDate: string;
  totalValue: number;
  receivedAmount: number;
  pendingAmount: number;
  movements: ReceivableMovement[];
  pendingMethods: Array<{
    type: string;
    amount: number;
    dueDate?: string;
    installment?: string;
  }>;
}

export function EnhancedReceivablesReport() {
  const { sales, checks, boletos } = useAppContext();
  const [selectedSale, setSelectedSale] = useState<SaleReceivable | null>(null);
  const [showModal, setShowModal] = useState(false);

  const receivables = useMemo(() => {
    const salesReceivables: SaleReceivable[] = [];

    sales.forEach(sale => {
      if (sale.pendingAmount <= 0 && sale.receivedAmount <= 0) return;

      const movements: ReceivableMovement[] = [];
      const pendingMethods: Array<{ type: string; amount: number; dueDate?: string; installment?: string }> = [];

      sale.paymentMethods?.forEach(method => {
        if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type)) {
          movements.push({
            date: sale.date,
            type: 'received',
            paymentMethod: method.type.replace('_', ' ').toUpperCase(),
            amount: method.amount,
            netAmount: method.amount,
            description: 'Recebido à vista',
            installmentInfo: 'Pagamento único'
          });
        } else if (method.type === 'cartao_credito') {
          if (method.installments && method.installments > 1) {
            for (let i = 1; i <= method.installments; i++) {
              const dueDate = new Date(sale.date);
              dueDate.setMonth(dueDate.getMonth() + i);

              pendingMethods.push({
                type: 'Cartão de Crédito',
                amount: method.installmentValue || method.amount / method.installments,
                dueDate: dueDate.toISOString().split('T')[0],
                installment: `${i}/${method.installments}`
              });
            }
          } else {
            movements.push({
              date: sale.date,
              type: 'received',
              paymentMethod: 'Cartão de Crédito',
              amount: method.amount,
              netAmount: method.amount,
              description: 'Recebido à vista',
              installmentInfo: 'Pagamento único'
            });
          }
        }
      });

      const saleChecks = checks.filter(c => c.saleId === sale.id);
      saleChecks.forEach(check => {
        const checkMovement: ReceivableMovement = {
          date: check.dueDate,
          type: check.status === 'compensado' ? 'received' : 'pending',
          paymentMethod: 'Cheque',
          amount: check.value,
          originalAmount: check.value,
          description: check.status === 'compensado' ? 'Cheque compensado' : 'Cheque pendente',
          installmentInfo: check.installmentNumber && check.totalInstallments
            ? `Parcela ${check.installmentNumber}/${check.totalInstallments}`
            : 'Cheque único'
        };

        if (check.usedInDebt && check.status !== 'compensado') {
          checkMovement.type = 'used_for_debt';
          checkMovement.description = `Cheque usado para pagar dívida: ${check.supplierName || 'Fornecedor'}`;
          checkMovement.relatedTo = check.usedInDebt;
        } else if (check.is_discounted) {
          checkMovement.type = 'anticipated';
          checkMovement.originalAmount = check.value;
          checkMovement.fee = check.discount_fee || 0;
          checkMovement.netAmount = check.discounted_amount || check.value;
          checkMovement.description = `Cheque antecipado (Taxa: R$ ${(check.discount_fee || 0).toFixed(2)})`;
        }

        if (check.status === 'compensado' || check.usedInDebt || check.is_discounted) {
          movements.push(checkMovement);
        } else if (check.status === 'pendente') {
          pendingMethods.push({
            type: 'Cheque',
            amount: check.value,
            dueDate: check.dueDate,
            installment: check.installmentNumber && check.totalInstallments
              ? `${check.installmentNumber}/${check.totalInstallments}`
              : 'Único'
          });
        }
      });

      const saleBoletos = boletos.filter(b => b.saleId === sale.id);
      saleBoletos.forEach(boleto => {
        const boletoMovement: ReceivableMovement = {
          date: boleto.dueDate,
          type: boleto.status === 'compensado' ? 'received' : 'pending',
          paymentMethod: 'Boleto',
          amount: boleto.value,
          originalAmount: boleto.value,
          description: boleto.status === 'compensado' ? 'Boleto pago' : 'Boleto pendente',
          installmentInfo: `Parcela ${boleto.installmentNumber}/${boleto.totalInstallments}`
        };

        if (boleto.status === 'compensado') {
          const finalAmount = boleto.finalAmount || boleto.value;
          const notaryCosts = boleto.notaryCosts || 0;
          const interestPaid = boleto.interestPaid || 0;
          const netReceived = finalAmount - notaryCosts;

          boletoMovement.originalAmount = boleto.value;
          boletoMovement.netAmount = netReceived;

          if (interestPaid > 0 || notaryCosts > 0) {
            boletoMovement.description = `Boleto pago com ${
              interestPaid > 0 ? `juros R$ ${interestPaid.toFixed(2)}` : ''
            }${
              interestPaid > 0 && notaryCosts > 0 ? ' e ' : ''
            }${
              notaryCosts > 0 ? `custas R$ ${notaryCosts.toFixed(2)}` : ''
            } (Líquido: R$ ${netReceived.toFixed(2)})`;
          } else {
            boletoMovement.description = `Boleto pago - Valor líquido: R$ ${netReceived.toFixed(2)}`;
          }

          movements.push(boletoMovement);
        } else if (boleto.status === 'pendente') {
          pendingMethods.push({
            type: 'Boleto',
            amount: boleto.value,
            dueDate: boleto.dueDate,
            installment: `${boleto.installmentNumber}/${boleto.totalInstallments}`
          });
        }
      });

      movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      salesReceivables.push({
        saleId: sale.id,
        client: sale.client,
        saleDate: sale.date,
        totalValue: sale.totalValue,
        receivedAmount: sale.receivedAmount,
        pendingAmount: sale.pendingAmount,
        movements,
        pendingMethods
      });
    });

    return salesReceivables.filter(r => r.pendingAmount > 0 || r.receivedAmount > 0);
  }, [sales, checks, boletos]);

  const totalReceivables = useMemo(() => {
    return receivables.reduce((sum, r) => sum + r.pendingAmount, 0);
  }, [receivables]);

  const openMovementDetails = (receivable: SaleReceivable) => {
    setSelectedSale(receivable);
    setShowModal(true);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'received': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'anticipated': return <TrendingUp className="w-5 h-5 text-yellow-600" />;
      case 'used_for_debt': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default: return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'received': return 'bg-green-50 border-green-200';
      case 'anticipated': return 'bg-yellow-50 border-yellow-200';
      case 'used_for_debt': return 'bg-blue-50 border-blue-200';
      case 'pending': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-green-600">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900">Valores a Receber</h3>
            <p className="text-green-700 font-semibold text-lg">
              Total: R$ {totalReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {receivables.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-green-300" />
              <p className="text-green-600 font-semibold">Nenhum valor a receber!</p>
              <p className="text-green-500 text-sm mt-2">
                Todos os pagamentos estão em dia
              </p>
            </div>
          ) : (
            receivables.map(receivable => (
              <div
                key={receivable.saleId}
                className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 text-lg">{receivable.client}</h4>
                    <p className="text-sm text-green-700">
                      Data da Venda: {new Date(receivable.saleDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => openMovementDetails(receivable)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Extrato
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-1">Valor Total</p>
                    <p className="text-lg font-bold text-green-900">
                      R$ {receivable.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-1">Já Recebido</p>
                    <p className="text-lg font-bold text-green-700">
                      R$ {receivable.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-red-200">
                    <p className="text-xs text-red-600 font-medium mb-1">A Receber</p>
                    <p className="text-lg font-bold text-red-700">
                      R$ {receivable.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {receivable.pendingMethods.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-2">Próximos Recebimentos Programados:</p>
                    <div className="space-y-2">
                      {receivable.pendingMethods.slice(0, 3).map((method, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-green-100">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-900">
                              {method.type} - {method.installment}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-700">
                              R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            {method.dueDate && (
                              <p className="text-xs text-green-600">
                                Venc: {new Date(method.dueDate).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {receivable.pendingMethods.length > 3 && (
                        <p className="text-xs text-center text-green-600">
                          ... e mais {receivable.pendingMethods.length - 3} recebimento(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Extrato de Recebimentos</h3>
                  <p className="text-green-100 font-medium">{selectedSale.client}</p>
                  <p className="text-green-100 text-sm">
                    Venda em {new Date(selectedSale.saleDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-900">
                    R$ {selectedSale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-1">Já Recebido</p>
                  <p className="text-2xl font-bold text-green-900">
                    R$ {selectedSale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                  <p className="text-sm text-red-600 font-medium mb-1">A Receber</p>
                  <p className="text-2xl font-bold text-red-900">
                    R$ {selectedSale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Histórico de Movimentações
                </h4>
                <div className="space-y-3">
                  {selectedSale.movements.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-500">Nenhuma movimentação registrada ainda</p>
                    </div>
                  ) : (
                    selectedSale.movements.map((movement, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border-2 ${getMovementColor(movement.type)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getMovementIcon(movement.type)}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-slate-900">{movement.paymentMethod}</p>
                                <p className="text-sm text-slate-600">{movement.description}</p>
                                <p className="text-xs text-slate-500 mt-1">{movement.installmentInfo}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">
                                  R$ {movement.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(movement.date).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>

                            {movement.type === 'anticipated' && movement.fee && (
                              <div className="mt-2 p-2 bg-white rounded border border-yellow-300">
                                <p className="text-xs text-yellow-700">
                                  <span className="font-semibold">Valor Original:</span> R$ {(movement.originalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-yellow-700">
                                  <span className="font-semibold">Taxa de Antecipação:</span> R$ {movement.fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-green-700 font-bold">
                                  <span className="font-semibold">Valor Líquido Recebido:</span> R$ {(movement.netAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            )}

                            {movement.type === 'used_for_debt' && movement.relatedTo && (
                              <div className="mt-2 p-2 bg-white rounded border border-blue-300">
                                <p className="text-xs text-blue-700">
                                  <span className="font-semibold">Usado para pagamento de dívida</span>
                                </p>
                              </div>
                            )}

                            {movement.netAmount && movement.netAmount !== movement.amount && movement.type === 'received' && (
                              <div className="mt-2 p-2 bg-white rounded border border-green-300">
                                <p className="text-xs text-green-700">
                                  <span className="font-semibold">Valor Líquido:</span> R$ {movement.netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedSale.pendingMethods.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    Recebimentos Pendentes
                  </h4>
                  <div className="space-y-2">
                    {selectedSale.pendingMethods.map((method, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200"
                      >
                        <div>
                          <p className="font-bold text-orange-900">{method.type}</p>
                          <p className="text-sm text-orange-700">{method.installment}</p>
                          {method.dueDate && (
                            <p className="text-xs text-orange-600">
                              Vencimento: {new Date(method.dueDate).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-orange-700">
                          R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
