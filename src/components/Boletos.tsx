import React, { useState } from 'react';
import { Eye, Upload, Calendar, AlertTriangle, CheckCircle, Receipt, Plus, Edit, Trash2, ChevronDown, ChevronRight, FileText, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Boleto } from '../types';
import { BoletoForm } from './forms/BoletoForm';

export function Boletos() {
  const { state, createBoleto, updateBoleto, deleteBoleto } = useApp();
  const [viewingBoleto, setViewingBoleto] = useState<Boleto | null>(null);
  const [uploadingBoleto, setUploadingBoleto] = useState<Boleto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const [expandedDebts, setExpandedDebts] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split('T')[0];
  const dueToday = state.boletos.filter(boleto => boleto.dueDate === today);
  const overdue = state.boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');

  // Group boletos by sales and debts
  const salesWithBoletos = state.sales.filter(sale => 
    state.boletos.some(boleto => boleto.saleId === sale.id)
  ).map(sale => ({
    ...sale,
    boletos: state.boletos.filter(boleto => boleto.saleId === sale.id)
  }));

  const debtsWithBoletos = state.debts.filter(debt => 
    debt.paymentMethods.some(method => method.type === 'boleto')
  ).map(debt => ({
    ...debt,
    boletos: state.boletos.filter(boleto => 
      // Find boletos that might be related to this debt
      boleto.client === debt.company || 
      (boleto.observations && boleto.observations.includes(debt.description))
    )
  }));

  const handleAddBoleto = (boleto: Omit<Boleto, 'id' | 'createdAt'>) => {
    createBoleto(boleto).then(() => {
      setIsFormOpen(false);
    }).catch(error => {
      alert('Erro ao criar boleto: ' + error.message);
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

  const handleDeleteBoleto = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este boleto? Esta ação não pode ser desfeita.')) {
      deleteBoleto(id).catch(error => {
        alert('Erro ao excluir boleto: ' + error.message);
      });
    }
  };

  const updateBoletoStatus = (boletoId: string, status: Boleto['status']) => {
    const boleto = state.boletos.find(b => b.id === boletoId);
    if (boleto) {
      let updatedBoleto = { ...boleto, status };
      
      if (status === 'cancelado') {
        const reason = prompt('Por favor, informe o motivo do cancelamento:');
        if (reason) {
          updatedBoleto.observations = `${boleto.observations || ''}\nCancelado: ${reason}`.trim();
        } else {
          return;
        }
      }
      
      updateBoleto(updatedBoleto).catch(error => {
        alert('Erro ao atualizar status: ' + error.message);
      });
    }
  };

  const handleFileUpload = (boletoId: string, file: File) => {
    const boleto = state.boletos.find(b => b.id === boletoId);
    if (boleto) {
      const updatedBoleto = { 
        ...boleto, 
        boletoFile: `boleto-${Date.now()}-${file.name}`,
        observations: `${boleto.observations || ''}\nArquivo anexado: ${file.name}`.trim()
      };
      updateBoleto(updatedBoleto).then(() => {
        setUploadingBoleto(null);
      }).catch(error => {
        alert('Erro ao anexar arquivo: ' + error.message);
      });
    }
  };

  const toggleSaleExpansion = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  const toggleDebtExpansion = (debtId: string) => {
    const newExpanded = new Set(expandedDebts);
    if (newExpanded.has(debtId)) {
      newExpanded.delete(debtId);
    } else {
      newExpanded.add(debtId);
    }
    setExpandedDebts(newExpanded);
  };

  const getStatusColor = (status: Boleto['status']) => {
    switch (status) {
      case 'compensado': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'vencido': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelado': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'nao_pago': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
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

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Receipt className="w-8 h-8 text-white" />
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
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Boletos</h1>
            <p className="text-slate-600 text-lg">Controle completo de boletos bancários</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary group flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Boleto
        </button>
      </div>

      {/* Summary Cards */}
      {(dueToday.length > 0 || overdue.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>
      )}

      {/* Todos os Boletos */}
      <div className="card modern-shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Todos os Boletos</h2>
          <p className="text-slate-600">Lista completa de todos os boletos registrados no sistema</p>
        </div>
        
        {state.boletos.length > 0 ? (
          <div className="overflow-x-auto modern-scrollbar">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Cliente</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Valor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Vencimento</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Parcela</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Arquivo</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Venda</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50">Ações</th>
                </tr>
              </thead>
              <tbody>
                {state.boletos.map(boleto => {
                  const relatedSale = state.sales.find(sale => sale.id === boleto.saleId);
                  
                  return (
                    <tr key={boleto.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300">
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">{boleto.client}</td>
                      <td className="py-4 px-6 text-sm font-black text-blue-600">
                        R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={
                          boleto.dueDate === today ? 'text-blue-600 font-bold' :
                          boleto.dueDate < today ? 'text-red-600 font-bold' :
                          'text-slate-900 font-medium'
                        }>
                          {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                        {boleto.dueDate === today && (
                          <div className="text-xs text-blue-600 font-bold">Vence hoje!</div>
                        )}
                        {boleto.dueDate < today && boleto.status === 'pendente' && (
                          <div className="text-xs text-red-600 font-bold">Vencido!</div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-bold border border-blue-200">
                          {boleto.installmentNumber}/{boleto.totalInstallments}
                        </span>
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
                        {boleto.boletoFile ? (
                          <span className="px-3 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                            ✓ Anexado
                          </span>
                        ) : (
                          <button
                            onClick={() => setUploadingBoleto(boleto)}
                            className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors font-bold border border-amber-200"
                          >
                            Anexar
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {relatedSale ? (
                          <div>
                            <span className="text-blue-600 font-medium">{relatedSale.client}</span>
                            <div className="text-xs text-slate-500">
                              {new Date(relatedSale.date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <Receipt className="w-12 h-12 text-blue-600" />
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

      {/* Sales with Boletos */}
      {salesWithBoletos.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Vendas com Boletos</h2>
            <p className="text-slate-600">Vendas que possuem boletos gerados</p>
          </div>
          
          <div className="space-y-4">
            {salesWithBoletos.map(sale => (
              <div key={sale.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                <div 
                  className="p-6 bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 cursor-pointer transition-modern"
                  onClick={() => toggleSaleExpansion(sale.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="p-2 rounded-lg bg-blue-600 text-white modern-shadow">
                        {expandedSales.has(sale.id) ? 
                          <ChevronDown className="w-5 h-5" /> : 
                          <ChevronRight className="w-5 h-5" />
                        }
                      </button>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{sale.client}</h3>
                        <p className="text-sm text-slate-600">
                          Data: {new Date(sale.date).toLocaleDateString('pt-BR')} • 
                          {sale.boletos.length} boleto(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">
                        R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sale.status === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                        sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sale.status === 'pago' ? 'Pago' :
                         sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedSales.has(sale.id) && (
                  <div className="border-t border-slate-200 bg-white">
                    <div className="p-6">
                      <h4 className="font-semibold text-slate-900 mb-4">Boletos desta Venda</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Parcela</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Valor</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Vencimento</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Arquivo</th>
                              <th className="text-left py-3 px-4 font-semibold text-slate-700">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sale.boletos.map(boleto => (
                              <tr key={boleto.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 text-sm">
                                  <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-bold">
                                    {boleto.installmentNumber}/{boleto.totalInstallments}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm font-bold text-emerald-600">
                                  R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  <span className={
                                    boleto.dueDate === today ? 'text-blue-600 font-bold' :
                                    boleto.dueDate < today ? 'text-red-600 font-bold' :
                                    'text-slate-900 font-medium'
                                  }>
                                    {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm">
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
                                <td className="py-3 px-4 text-sm">
                                  {boleto.boletoFile ? (
                                    <span className="px-3 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                      ✓ Anexado
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setUploadingBoleto(boleto)}
                                      className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors font-bold border border-amber-200"
                                    >
                                      Anexar
                                    </button>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  {relatedSale ? (
                                    <div>
                                      <span className="text-blue-600 font-medium">{relatedSale.client}</span>
                                      <div className="text-xs text-slate-500">
                                        {new Date(relatedSale.date).toLocaleDateString('pt-BR')}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 font-bold">
                                      Manual
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm">
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
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
                      <Receipt className="w-12 h-12 text-blue-600" />
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

              {/* Resumo de Totais */}
              {state.boletos.length > 0 && (
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl border-2 border-blue-300">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">Resumo Geral</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <p className="text-blue-600 font-semibold">Total de Boletos</p>
                      <p className="text-2xl font-black text-blue-800">{state.boletos.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-600 font-semibold">Valor Total</p>
                      <p className="text-2xl font-black text-blue-800">
                        R$ {state.boletos.reduce((sum, b) => sum + b.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-600 font-semibold">Compensados</p>
                      <p className="text-2xl font-black text-green-600">
                        {state.boletos.filter(b => b.status === 'compensado').length}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-600 font-semibold">Pendentes</p>
                      <p className="text-2xl font-black text-orange-600">
                        {state.boletos.filter(b => b.status === 'pendente').length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Debts with Boletos */}
      {debtsWithBoletos.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Dívidas com Boletos</h2>
            <p className="text-slate-600">Dívidas que possuem boletos para pagamento</p>
          </div>
          
          <div className="space-y-4">
            {debtsWithBoletos.map(debt => (
              <div key={debt.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                <div 
                  className="p-6 bg-gradient-to-r from-orange-50 to-transparent hover:from-orange-100 cursor-pointer transition-modern"
                  onClick={() => toggleDebtExpansion(debt.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="p-2 rounded-lg bg-orange-600 text-white modern-shadow">
                        {expandedDebts.has(debt.id) ? 
                          <ChevronDown className="w-5 h-5" /> : 
                          <ChevronRight className="w-5 h-5" />
                        }
                      </button>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{debt.company}</h3>
                        <p className="text-sm text-slate-600">
                          Data: {new Date(debt.date).toLocaleDateString('pt-BR')} • 
                          {debt.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-600">
                        R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        debt.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {debt.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedDebts.has(debt.id) && (
                  <div className="border-t border-slate-200 bg-white">
                    <div className="p-6">
                      <h4 className="font-semibold text-slate-900 mb-4">Métodos de Pagamento</h4>
                      <div className="space-y-3">
                        {debt.paymentMethods.map((method, index) => (
                          <div key={index} className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex justify-between items-center">
                              <span className="font-medium capitalize text-slate-900">
                                {method.type.replace('_', ' ')}
                              </span>
                              <span className="font-bold text-slate-900">
                                R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            {method.installments && method.installments > 1 && (
                              <div className="text-sm text-slate-600 mt-2">
                                {method.installments}x de R$ {method.installmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* View Boleto Modal */}
      {viewingBoleto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                    <Receipt className="w-8 h-8 text-white" />
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
                  <p className="text-lg text-slate-900 font-bold">{viewingBoleto.client}</p>
                </div>
                <div>
                  <label className="form-label">Valor</label>
                  <p className="text-2xl font-black text-blue-600">
                    R$ {viewingBoleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Vencimento</label>
                  <p className="text-lg text-slate-900 font-bold">
                    {new Date(viewingBoleto.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                  {viewingBoleto.dueDate === today && (
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                      Vence hoje!
                    </span>
                  )}
                  {viewingBoleto.dueDate < today && viewingBoleto.status === 'pendente' && (
                    <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                      Vencido!
                    </span>
                  )}
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(viewingBoleto.status)}`}>
                    {getStatusLabel(viewingBoleto.status)}
                  </span>
                </div>
                <div>
                  <label className="form-label">Parcela</label>
                  <p className="text-lg text-slate-900 font-bold">
                    {viewingBoleto.installmentNumber} de {viewingBoleto.totalInstallments}
                  </p>
                </div>
                <div>
                  <label className="form-label">Arquivo</label>
                  {viewingBoleto.boletoFile ? (
                    <p className="text-emerald-600 font-bold">✓ Boleto anexado</p>
                  ) : (
                    <p className="text-amber-600 font-bold">⚠️ Aguardando anexo</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Venda Relacionada</label>
                  {viewingBoleto.saleId ? (
                    (() => {
                      const sale = state.sales.find(s => s.id === viewingBoleto.saleId);
                      return sale ? (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <p className="font-bold text-blue-900">{sale.client}</p>
                          <p className="text-sm text-blue-700">
                            Data da venda: {new Date(sale.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-blue-700">
                            Valor total: R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-blue-700">
                            Status: {sale.status === 'pago' ? 'Pago' : sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-500">Venda não encontrada</p>
                      );
                    })()
                  ) : (
                    <p className="text-slate-500">Boleto criado manualmente</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Data de Criação</label>
                  <p className="text-sm text-slate-600">
                    {new Date(viewingBoleto.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {viewingBoleto.observations && (
                <div className="mb-8">
                  <label className="form-label">Observações</label>
                  <div className="p-4 bg-slate-50 rounded-xl border">
                    <p className="text-slate-900 whitespace-pre-wrap">{viewingBoleto.observations}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setEditingBoleto(viewingBoleto)}
                  className="btn-secondary"
                >
                  Editar
                </button>
                <button
                  onClick={() => setViewingBoleto(null)}
                  className="btn-primary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadingBoleto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full modern-shadow-xl">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 modern-shadow-xl">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Anexar Boleto</h2>
              </div>
              
              <div className="mb-8">
                <p className="text-sm text-slate-600 mb-6">
                  <strong>Cliente:</strong> {uploadingBoleto.client}<br />
                  <strong>Valor:</strong> R$ {uploadingBoleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<br />
                  <strong>Parcela:</strong> {uploadingBoleto.installmentNumber}/{uploadingBoleto.totalInstallments}
                </p>
                
                <div className="border-2 border-dashed border-amber-300 rounded-2xl p-8 text-center hover:border-amber-400 transition-colors bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
                  <Upload className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                  <p className="text-sm text-slate-700 mb-2 font-bold">
                    Clique para selecionar o arquivo do boleto
                  </p>
                  <p className="text-xs text-slate-500">
                    Formatos aceitos: PDF, JPG, PNG
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(uploadingBoleto.id, file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setUploadingBoleto(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}