import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, FileText, Calendar, AlertCircle, X, Clock, DollarSign, AlertTriangle, CreditCard } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Boleto } from '../types';
import { BoletoForm } from './forms/BoletoForm';
import { OverdueBoletoForm } from './forms/OverdueBoletoForm';

export function Boletos() {
  const { boletos, sales, debts, employees, isLoading, error, createBoleto, updateBoleto, deleteBoleto, updateDebt, createCashTransaction } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
  const [viewingBoleto, setViewingBoleto] = useState<Boleto | null>(null);
  const [managingOverdueBoleto, setManagingOverdueBoleto] = useState<Boleto | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const dueToday = boletos.filter(boleto => boleto.dueDate === today);
  const overdue = boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');
  const overdueManaged = boletos.filter(boleto => boleto.dueDate < today && boleto.overdueAction);
  
  // Novos cálculos para widgets
  const notDueYet = boletos.filter(boleto => boleto.dueDate > today && boleto.status === 'pendente');
  const totalNotDueYet = notDueYet.reduce((sum, boleto) => sum + boleto.value, 0);
  
  // Boletos que a empresa tem para pagar
  const companyPayableBoletos = boletos.filter(boleto => 
    boleto.isCompanyPayable === true && boleto.status !== 'compensado'
  );
  const totalCompanyPayableBoletos = companyPayableBoletos.reduce((sum, boleto) => sum + boleto.value, 0);

  const handleAddBoleto = (boleto: Omit<Boleto, 'id' | 'createdAt'>) => {
    console.log('🔄 Adicionando novo boleto:', boleto);
    
    // Validate boleto data before submitting
    if (!boleto.client || !boleto.client.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    
    if (boleto.value <= 0) {
      alert('O valor do boleto deve ser maior que zero.');
      return;
    }
    
    if (boleto.installmentNumber > boleto.totalInstallments) {
      alert('O número da parcela não pode ser maior que o total de parcelas.');
      return;
    }
    
    createBoleto(boleto).then(() => {
      console.log('✅ Boleto adicionado com sucesso');
      setIsFormOpen(false);
    }).catch(error => {
      console.error('❌ Erro ao adicionar boleto:', error);
      let errorMessage = 'Erro ao criar boleto';
      
      if (error.message) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint') || error.message.includes('já existe')) {
          errorMessage = 'Este boleto já existe no sistema. O sistema previne duplicatas automaticamente.';
        } else if (error.message.includes('constraint') || error.message.includes('violates')) {
          errorMessage = 'Dados inválidos ou duplicados. Verifique as informações inseridas.';
        } else if (error.message.includes('invalid input syntax')) {
          errorMessage = 'Formato de dados inválido. Verifique os valores inseridos.';
        } else if (error.message.includes('null value')) {
          errorMessage = 'Campos obrigatórios não preenchidos. Verifique todos os campos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert('Erro ao criar boleto: ' + errorMessage);
    });
  };

  const handleEditBoleto = (boleto: Omit<Boleto, 'id' | 'createdAt'>) => {
    if (editingBoleto) {
      const updatedBoleto: Boleto = {
        ...boleto,
        id: editingBoleto.id,
        createdAt: editingBoleto.createdAt
      };
      updateBoleto(updatedBoleto).then(() => {
        setEditingBoleto(null);
      }).catch(error => {
        alert('Erro ao atualizar boleto: ' + error.message);
      });
    }
  };

  const handleOverdueAction = (boleto: Omit<Boleto, 'id' | 'createdAt'>) => {
    if (managingOverdueBoleto) {
      const updatedBoleto: Boleto = {
        ...boleto,
        id: managingOverdueBoleto.id,
        createdAt: managingOverdueBoleto.createdAt
      };
      updateBoleto(updatedBoleto).then(() => {
        setManagingOverdueBoleto(null);
      }).catch(error => {
        alert('Erro ao atualizar boleto vencido: ' + error.message);
      });
    }
  };

  const handleDeleteBoleto = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este boleto? Esta ação não pode ser desfeita.')) {
      deleteBoleto(id).catch(error => {
        alert('Erro ao excluir boleto: ' + error.message);
      });
    }
  };

  const updateBoletoStatus = (boletoId: string, status: Boleto['status']) => {
    const boleto = boletos.find(b => b.id === boletoId);
    if (boleto) {
      let updatedBoleto = { ...boleto, status };
      
      // Se o boleto foi marcado como compensado, atualizar o caixa
      if (status === 'compensado' && boleto.status !== 'compensado') {
        // Cash transactions are handled automatically by database triggers
        console.log('✅ Boleto marcado como compensado, transações de caixa serão criadas automaticamente');
      }
      
      updateBoleto(updatedBoleto).catch(error => {
        alert('Erro ao atualizar status: ' + error.message);
      });
    }
  };

  const getStatusColor = (status: Boleto['status']) => {
    switch (status) {
      case 'compensado': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'vencido': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelado': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'nao_pago': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusLabel = (status: Boleto['status']) => {
    switch (status) {
      case 'compensado': return 'Compensado';
      case 'vencido': return 'Vencido';
      case 'cancelado': return 'Cancelado';
      case 'nao_pago': return 'Não Pago';
      default: return 'Pendente';
    }
  };

  const getOverdueActionLabel = (action?: string) => {
    switch (action) {
      case 'pago_com_juros': return 'Pago com Juros';
      case 'pago_com_multa': return 'Pago com Multa';
      case 'pago_integral': return 'Pago Integral';
      case 'protestado': return 'Protestado';
      case 'negativado': return 'Negativado';
      case 'acordo_realizado': return 'Acordo Realizado';
      case 'cancelado': return 'Cancelado';
      case 'perda_total': return 'Perda Total';
      default: return 'Não Definido';
    }
  };

  const getOverdueActionColor = (action?: string) => {
    switch (action) {
      case 'pago_com_juros':
      case 'pago_com_multa':
      case 'pago_integral': return 'bg-green-100 text-green-800 border-green-200';
      case 'acordo_realizado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'protestado':
      case 'negativado': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelado':
      case 'perda_total': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando boletos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl floating-animation">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Boletos</h1>
            <p className="text-slate-600 text-lg">Controle completo de boletos bancários</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Boleto
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Erro no Sistema</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Boletos não vencidos */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Não Vencidos</h3>
              <p className="text-green-700 font-medium">{notDueYet.length} boleto(s)</p>
              <p className="text-sm text-green-600 font-semibold">
                Total: R$ {totalNotDueYet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Boletos para pagar */}
        <div className="card bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-600 modern-shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Para Pagar</h3>
              <p className="text-orange-700 font-medium">{companyPayableBoletos.length} dívida(s)</p>
              <p className="text-sm text-orange-600 font-semibold">
                Total: R$ {totalCompanyPayableBoletos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

          {dueToday.length > 0 && (
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg">Vencimentos Hoje</h3>
                  <p className="text-blue-700 font-medium">{dueToday.length} boleto(s)</p>
                  <p className="text-sm text-blue-600 font-semibold">
                    Total: R$ {dueToday.reduce((sum, boleto) => sum + boleto.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {overdue.length > 0 && (
            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 modern-shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-600 modern-shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-red-900 text-lg">Boletos Vencidos</h3>
                  <p className="text-red-700 font-medium">{overdue.length} boleto(s)</p>
                  <p className="text-sm text-red-600 font-semibold">
                    Total: R$ {overdue.reduce((sum, boleto) => sum + boleto.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {overdueManaged.length > 0 && (
            <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 modern-shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-600 modern-shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 text-lg">Vencidos Gerenciados</h3>
                  <p className="text-orange-700 font-medium">{overdueManaged.length} boleto(s)</p>
                  <p className="text-sm text-orange-600 font-semibold">
                    Total Final: R$ {overdueManaged.reduce((sum, boleto) => sum + (boleto.finalAmount || boleto.value), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Boletos List */}
      <div className="space-y-8">
        {/* Vendas com Boletos */}
        {sales.filter(sale => 
          sale.paymentMethods?.some(method => method.type === 'boleto')
        ).length > 0 && (
          <div className="card modern-shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-blue-600">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Vendas com Boletos</h3>
            </div>
            
            <div className="space-y-4">
              {sales.filter(sale => 
                sale.paymentMethods?.some(method => method.type === 'boleto')
              ).map(sale => {
                const saleBoletos = boletos.filter(boleto => boleto.saleId === sale.id);
                const totalBoletoValue = saleBoletos.reduce((sum, boleto) => sum + boleto.value, 0);
                const paidBoletos = saleBoletos.filter(boleto => boleto.status === 'compensado');
                const overdueBoletos = saleBoletos.filter(boleto => 
                  boleto.dueDate < new Date().toISOString().split('T')[0] && boleto.status === 'pendente'
                );
                
                return (
                  <div key={sale.id} className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-blue-900">{sale.client}</h4>
                        <p className="text-blue-700">
                          Venda: {new Date(sale.date).toLocaleDateString('pt-BR')} • 
                          {saleBoletos.length} boleto(s) • 
                          Status: {sale.status.toUpperCase()}
                        </p>
                        {sale.sellerId && (
                          <p className="text-sm text-blue-600">
                            Vendedor: {employees.find(e => e.id === sale.sellerId)?.name || 'N/A'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-blue-600">
                          R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-blue-700">
                          Boletos: R$ {totalBoletoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Status Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200">
                        <p className="text-green-600 font-semibold text-sm">Pagos</p>
                        <p className="text-lg font-bold text-green-700">{paidBoletos.length}</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                        <p className="text-yellow-600 font-semibold text-sm">Pendentes</p>
                        <p className="text-lg font-bold text-yellow-700">
                          {saleBoletos.filter(b => b.status === 'pendente').length}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-xl border border-red-200">
                        <p className="text-red-600 font-semibold text-sm">Vencidos</p>
                        <p className="text-lg font-bold text-red-700">{overdueBoletos.length}</p>
                      </div>
                    </div>
                    
                    {/* Boletos da Venda */}
                    <div className="space-y-3">
                      <h5 className="font-bold text-blue-900">Boletos desta Venda:</h5>
                      {saleBoletos.map(boleto => {
                        const isOverdue = boleto.dueDate < new Date().toISOString().split('T')[0] && boleto.status === 'pendente';
                        const daysOverdue = isOverdue ? 
                          Math.ceil((new Date().getTime() - new Date(boleto.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                        
                        return (
                          <div key={boleto.id} className="p-4 bg-white rounded-xl border border-blue-100">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-bold text-slate-900">
                                  Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                                </p>
                                <p className="text-sm text-slate-600">
                                  Vencimento: {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                                  {isOverdue && (
                                    <span className="text-red-600 font-bold ml-2">
                                      ({daysOverdue} dias vencido)
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-blue-600">
                                  R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(boleto.status)}`}>
                                  {getStatusLabel(boleto.status)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Ações do Boleto */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {boleto.status === 'pendente' && (
                                  <select
                                    value={boleto.status}
                                    onChange={(e) => {
                                      const newStatus = e.target.value as Boleto['status'];
                                      if (newStatus === 'compensado') {
                                        if (confirm(`Marcar boleto como pago?\n\nValor: R$ ${boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nEste valor será adicionado ao caixa da empresa.`)) {
                                          updateBoletoStatus(boleto.id, newStatus);
                                        }
                                      } else {
                                        updateBoletoStatus(boleto.id, newStatus);
                                      }
                                    }}
                                    className="text-xs border rounded-lg px-2 py-1 bg-white modern-shadow"
                                  >
                                    <option value="pendente">Pendente</option>
                                    <option value="compensado">Compensado</option>
                                    <option value="vencido">Vencido</option>
                                    <option value="cancelado">Cancelado</option>
                                    <option value="nao_pago">Não Pago</option>
                                  </select>
                                )}
                                {isOverdue && !boleto.overdueAction && (
                                  <button
                                    onClick={() => setManagingOverdueBoleto(boleto)}
                                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                                  >
                                    Gerenciar Vencimento
                                  </button>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewingBoleto(boleto)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                  title="Ver Detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingBoleto(boleto)}
                                  className="text-emerald-600 hover:text-emerald-800 p-1 rounded"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {boleto.observations && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-700">{boleto.observations}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Informações da Venda */}
                    <div className="mt-4 p-4 bg-white rounded-xl border border-blue-100">
                      <h5 className="font-bold text-slate-900 mb-2">Informações da Venda:</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Data:</strong> {new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Valor Total:</strong> R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p><strong>Status:</strong> {sale.status.toUpperCase()}</p>
                        </div>
                        <div>
                          <p><strong>Recebido:</strong> R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p><strong>Pendente:</strong> R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          {sale.deliveryDate && (
                            <p><strong>Entrega:</strong> {new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}</p>
                          )}
                        </div>
                      </div>
                      {sale.observations && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-700">{sale.observations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Boletos Recebíveis */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Todos os Boletos a Receber</h3>
          </div>
          
        {boletos.length > 0 ? (
          <div className="overflow-x-auto modern-scrollbar">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Cliente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Valor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Vencimento</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Situação</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Parcela</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Venda</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Ações</th>
                </tr>
              </thead>
              <tbody>
                {boletos.map(boleto => (
                  <tr key={boleto.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300">
                    <td className="py-4 px-6 text-sm font-bold text-slate-900">{boleto.client}</td>
                    <td className="py-4 px-6 text-sm font-black text-blue-600">
                      <div>
                        <span>R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        {boleto.finalAmount && boleto.finalAmount !== boleto.value && (
                          <div className="text-xs text-green-600 font-bold">
                            Final: R$ {boleto.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={
                        boleto.dueDate === today ? 'text-blue-600 font-medium' :
                        boleto.dueDate < today ? 'text-red-600 font-medium' :
                        'text-gray-900'
                      }>
                        {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                      {boleto.dueDate < today && (
                        <div className="text-xs text-red-500 font-bold">
                          {Math.ceil((new Date().getTime() - new Date(boleto.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias vencido
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(boleto.status)}`}>
                          {getStatusLabel(boleto.status)}
                        </span>
                        {(boleto.status === 'pendente' || boleto.status === 'vencido') && (
                          <select
                            value={boleto.status}
                            onChange={(e) => updateBoletoStatus(boleto.id, e.target.value as Boleto['status'])}
                            className="text-xs border rounded-lg px-2 py-1 bg-white modern-shadow"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="compensado">Compensado</option>
                            <option value="vencido">Vencido</option>
                            <option value="cancelado">Cancelado</option>
                            <option value="nao_pago">Não Pago</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {boleto.dueDate < today ? (
                        <div className="space-y-1">
                          {boleto.overdueAction ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getOverdueActionColor(boleto.overdueAction)}`}>
                              {getOverdueActionLabel(boleto.overdueAction)}
                            </span>
                          ) : (
                            <button
                              onClick={() => setManagingOverdueBoleto(boleto)}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                            >
                              Gerenciar Vencimento
                            </button>
                          )}
                          {boleto.overdueAction && (
                            <button
                              onClick={() => setManagingOverdueBoleto(boleto)}
                              className="block px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                              Editar Situação
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Em dia</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {boleto.installmentNumber}/{boleto.totalInstallments}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {boleto.saleId ? (
                        (() => {
                          const sale = sales.find(s => s.id === boleto.saleId);
                          return sale ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                              Venda: {sale.client}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">Venda não encontrada</span>
                          );
                        })()
                      ) : (
                        <span className="text-slate-400 text-xs">Manual</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingBoleto(boleto)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingBoleto(boleto)}
                          className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBoleto(boleto.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Nenhum boleto registrado</h3>
            <p className="text-slate-600 mb-8 text-lg">Comece registrando seu primeiro boleto para controlar os recebimentos.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary modern-shadow-xl"
            >
              Registrar primeiro boleto
            </button>
          </div>
        )}
        </div>

        {/* Boletos que a empresa tem para pagar */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-orange-600">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-orange-900">Boletos que a Empresa Deve Pagar</h3>
            <span className="text-orange-600 font-semibold">
              Total: R$ {totalCompanyPayableBoletos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          {companyPayableBoletos.length > 0 ? (
            <div className="overflow-x-auto modern-scrollbar">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Empresa/Fornecedor</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Valor</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Vencimento</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Status</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Parcela</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Situação</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-orange-50 to-red-50">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {companyPayableBoletos.map(boleto => {
                    const daysOverdue = boleto.dueDate < today ? 
                      Math.ceil((new Date().getTime() - new Date(boleto.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    
                    return (
                      <tr key={boleto.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 transition-all duration-300">
                        <td className="py-4 px-6 text-sm font-bold text-slate-900">
                          {boleto.companyName || boleto.client}
                          {boleto.observations && (
                            <div className="text-xs text-orange-600 mt-1">{boleto.observations}</div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm font-black text-orange-600">
                          <div>
                            <span>R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            {boleto.interestPaid && boleto.interestPaid > 0 && (
                              <div className="text-xs text-red-600 font-bold">
                                + Juros: R$ {boleto.interestPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className={
                            boleto.dueDate === today ? 'text-blue-600 font-medium' :
                            boleto.dueDate < today ? 'text-red-600 font-medium' :
                            'text-gray-900'
                          }>
                            {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                          {daysOverdue > 0 && (
                            <div className="text-xs text-red-500 font-bold">
                              {daysOverdue} dias vencido
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(boleto.status)}`}>
                            {getStatusLabel(boleto.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                            {boleto.installmentNumber}/{boleto.totalInstallments}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          {boleto.status === 'compensado' ? (
                            <div className="space-y-1">
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                ✓ Pago
                              </span>
                              {boleto.paymentDate && (
                                <div className="text-xs text-green-600">
                                  {new Date(boleto.paymentDate).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {daysOverdue > 0 && (
                                <div>
                                  <label className="block text-xs text-orange-700 font-semibold mb-1">
                                    Juros Pagos (opcional)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0,00"
                                    className="w-full px-2 py-1 text-sm border border-orange-300 rounded"
                                    onChange={(e) => {
                                      const interestValue = parseFloat(e.target.value) || 0;
                                      boleto.interestPaid = interestValue;
                                    }}
                                  />
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  const interestPaid = boleto.interestPaid || 0;
                                  const totalToPay = boleto.value + interestPaid;
                                  const confirmMessage = interestPaid > 0 
                                    ? `Marcar este boleto como pago?\n\nValor original: R$ ${boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nJuros: R$ ${interestPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nTotal a pagar: R$ ${totalToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nEste valor será descontado do caixa da empresa.`
                                    : `Marcar este boleto como pago?\n\nValor: R$ ${boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nEste valor será descontado do caixa da empresa.`;
                                    
                                  if (window.confirm(confirmMessage)) {
                                    const updatedBoleto = { 
                                      ...boleto, 
                                      status: 'compensado' as const,
                                      paymentDate: new Date().toISOString().split('T')[0],
                                      interestPaid: interestPaid
                                    };
                                    updateBoleto(updatedBoleto).catch(error => {
                                      alert('Erro ao marcar como pago: ' + error.message);
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-sm"
                              >
                                Marcar como Pago
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingBoleto(boleto)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern"
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingBoleto(boleto)}
                              className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBoleto(boleto.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-orange-300" />
              <p className="text-orange-600 font-medium">Nenhum boleto da empresa para pagar</p>
              <p className="text-orange-500 text-sm mt-2">
                Boletos que a empresa deve pagar aparecerão aqui
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Boleto Form Modal */}
      {(isFormOpen || editingBoleto) && (
        <BoletoForm
          boleto={editingBoleto}
          onSubmit={editingBoleto ? handleEditBoleto : handleAddBoleto}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingBoleto(null);
          }}
        />
      )}

      {/* Overdue Boleto Management Modal */}
      {managingOverdueBoleto && (
        <OverdueBoletoForm
          boleto={managingOverdueBoleto}
          onSubmit={handleOverdueAction}
          onCancel={() => setManagingOverdueBoleto(null)}
        />
      )}

      {/* View Boleto Modal */}
      {viewingBoleto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Detalhes do Boleto</h2>
                </div>
                <button
                  onClick={() => setViewingBoleto(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Cliente</label>
                  <p className="text-sm text-slate-900 font-medium">{viewingBoleto.client}</p>
                </div>
                <div>
                  <label className="form-label">Valor</label>
                  <p className="text-sm text-slate-900 font-bold text-blue-600">
                    R$ {viewingBoleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {viewingBoleto.finalAmount && viewingBoleto.finalAmount !== viewingBoleto.value && (
                    <p className="text-sm text-green-600 font-bold">
                      Valor Final: R$ {viewingBoleto.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Vencimento</label>
                  <p className="text-sm text-slate-900 font-medium">
                    {new Date(viewingBoleto.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                  {viewingBoleto.dueDate < today && (
                    <p className="text-sm text-red-600 font-bold">
                      {Math.ceil((new Date().getTime() - new Date(viewingBoleto.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias vencido
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingBoleto.status)}`}>
                    {getStatusLabel(viewingBoleto.status)}
                  </span>
                </div>
                {viewingBoleto.overdueAction && (
                  <div className="md:col-span-2">
                    <label className="form-label">Situação do Vencimento</label>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getOverdueActionColor(viewingBoleto.overdueAction)}`}>
                      {getOverdueActionLabel(viewingBoleto.overdueAction)}
                    </span>
                  </div>
                )}
                <div>
                  <label className="form-label">Parcela</label>
                  <p className="text-sm text-slate-900 font-medium">
                    {viewingBoleto.installmentNumber} de {viewingBoleto.totalInstallments}
                  </p>
                </div>
                <div>
                  <label className="form-label">Venda Associada</label>
                  <p className="text-sm text-slate-900">
                    {viewingBoleto.saleId ? (
                      (() => {
                        const sale = sales.find(s => s.id === viewingBoleto.saleId);
                        return sale ? `Venda: ${sale.client} (${new Date(sale.date).toLocaleDateString('pt-BR')})` : 'Venda não encontrada';
                      })()
                    ) : (
                      'Boleto manual'
                    )}
                  </p>
                </div>
              </div>

              {/* Informações de Vencimento */}
              {viewingBoleto.dueDate < today && viewingBoleto.overdueAction && (
                <div className="mb-8">
                  <label className="form-label">Detalhes do Vencimento</label>
                  <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Ação Tomada:</strong> {getOverdueActionLabel(viewingBoleto.overdueAction)}</p>
                        {viewingBoleto.interestAmount && viewingBoleto.interestAmount > 0 && (
                          <p><strong>Juros:</strong> R$ {viewingBoleto.interestAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        )}
                        {viewingBoleto.penaltyAmount && viewingBoleto.penaltyAmount > 0 && (
                          <p><strong>Multa:</strong> R$ {viewingBoleto.penaltyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        )}
                      </div>
                      <div>
                        {viewingBoleto.notaryCosts && viewingBoleto.notaryCosts > 0 && (
                          <p><strong>Custos de Cartório:</strong> R$ {viewingBoleto.notaryCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        )}
                        {viewingBoleto.finalAmount && (
                          <p><strong>Valor Final:</strong> R$ {viewingBoleto.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        )}
                      </div>
                    </div>
                    {viewingBoleto.overdueNotes && (
                      <div className="mt-4">
                        <p><strong>Observações do Vencimento:</strong></p>
                        <p className="text-slate-700 mt-1 p-3 bg-white rounded-lg border">{viewingBoleto.overdueNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewingBoleto.observations && (
                <div className="mb-8">
                  <label className="form-label">Observações</label>
                  <p className="text-sm text-slate-900 p-4 bg-slate-50 rounded-xl border">
                    {viewingBoleto.observations}
                  </p>
                </div>
              )}

              {viewingBoleto.boletoFile && (
                <div className="mb-8">
                  <label className="form-label">Arquivo do Boleto</label>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-800 font-medium">
                      ✓ Arquivo anexado
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      {viewingBoleto.boletoFile}
                    </p>
                  </div>
                </div>
              )}

              {viewingBoleto.saleId && (
                <div className="mb-8">
                  <label className="form-label">Informações da Venda</label>
                  {(() => {
                    const sale = sales.find(s => s.id === viewingBoleto.saleId);
                    return sale ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <p><strong>Cliente:</strong> {sale.client}</p>
                          <p><strong>Data da Venda:</strong> {new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Valor Total:</strong> R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p><strong>Status da Venda:</strong> {sale.status.toUpperCase()}</p>
                          {sale.deliveryDate && (
                            <p><strong>Data de Entrega:</strong> {new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}</p>
                          )}
                          {sale.sellerId && (
                            <p><strong>Vendedor:</strong> {employees.find(e => e.id === sale.sellerId)?.name || 'N/A'}</p>
                          )}
                        </div>
                        {sale.observations && (
                          <div className="mt-4">
                            <p><strong>Observações da Venda:</strong></p>
                            <p className="text-slate-700 mt-1">{sale.observations}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-700">Venda não encontrada</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingBoleto(null)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}