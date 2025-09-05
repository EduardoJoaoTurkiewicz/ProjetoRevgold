import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, User, Package, FileText, Eye, Edit, Trash2, X, CreditCard, Receipt, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Play } from 'lucide-react';
import SaleForm from './forms/SaleForm';
import { useAppContext } from '../context/AppContext';
import { sanitizePayload, isValidUUID, debugService } from '../lib/supabaseServices';
import type { Sale } from '../types';
import { DebugPanel } from './DebugPanel';
import { TestSaleCreation } from './TestSaleCreation';

export function Sales() {
  const { 
    sales, 
    employees, 
    checks,
    boletos,
    loading, 
    createSale, 
    updateSale, 
    deleteSale 
  } = useAppContext();
  
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDebugErrors, setShowDebugErrors] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);

  const handleSaleSubmit = async (saleData: Partial<Sale>) => {
    try {
      console.log('🔄 Sales.handleSaleSubmit called with:', saleData);
      
      // Enhanced frontend validation and sanitization
      const sanitizedSaleData = sanitizePayload(saleData);
      console.log('🧹 Sanitized sale data:', sanitizedSaleData);
      
      // Comprehensive frontend validation
      if (!sanitizedSaleData.client || !sanitizedSaleData.client.trim()) {
        alert('Por favor, informe o nome do cliente.');
        return;
      }
      
      // Enhanced seller validation
      if (sanitizedSaleData.sellerId) {
        if (!isValidUUID(sanitizedSaleData.sellerId)) {
          console.warn('⚠️ Invalid seller UUID, converting to null:', sanitizedSaleData.sellerId);
          sanitizedSaleData.sellerId = null;
        } else {
          const seller = employees.find(emp => emp.id === sanitizedSaleData.sellerId && emp.isActive);
          if (!seller) {
            alert('Vendedor selecionado não existe ou não está ativo. Selecione um vendedor válido ou deixe em branco.');
            return;
          }
        }
      }
      
      // Validate client UUID if it looks like one
      if (sanitizedSaleData.client && sanitizedSaleData.client.length === 36) {
        if (!isValidUUID(sanitizedSaleData.client)) {
          alert('ID do cliente parece ser um UUID inválido. Use o nome do cliente em vez do ID.');
          return;
        }
      }
      
      // Enhanced value validation
      if (!sanitizedSaleData.totalValue || sanitizedSaleData.totalValue <= 0) {
        alert('O valor total da venda deve ser maior que zero.');
        return;
      }
      
      // Enhanced payment methods validation
      if (!sanitizedSaleData.paymentMethods || sanitizedSaleData.paymentMethods.length === 0) {
        alert('Por favor, adicione pelo menos um método de pagamento.');
        return;
      }
      
      // Validate payment methods structure
      for (const method of sanitizedSaleData.paymentMethods) {
        if (!method.type || typeof method.type !== 'string') {
          alert('Todos os métodos de pagamento devem ter um tipo válido.');
          return;
        }
        if (typeof method.amount !== 'number' || method.amount <= 0) {
          alert('Todos os métodos de pagamento devem ter um valor válido maior que zero.');
          return;
        }
      }
      
      const totalPaymentAmount = sanitizedSaleData.paymentMethods.reduce((sum, method) => sum + (method.amount || 0), 0);
      if (totalPaymentAmount === 0) {
        alert('Por favor, informe pelo menos um método de pagamento com valor maior que zero.');
        return;
      }
      
      if (totalPaymentAmount > sanitizedSaleData.totalValue) {
        alert('O total dos métodos de pagamento não pode ser maior que o valor total da venda.');
        return;
      }
      
      // Enhanced logging for debugging
      console.log('📤 Final sale data being sent:', {
        client: sanitizedSaleData.client,
        sellerId: sanitizedSaleData.sellerId,
        totalValue: sanitizedSaleData.totalValue,
        paymentMethodsCount: sanitizedSaleData.paymentMethods?.length || 0,
        receivedAmount: sanitizedSaleData.receivedAmount,
        pendingAmount: sanitizedSaleData.pendingAmount,
        status: sanitizedSaleData.status
      });
      
      if (editingSale) {
        console.log('🔄 Updating existing sale:', editingSale.id);
        const updatedSale = await updateSale(editingSale.id, sanitizedSaleData);
        console.log('✅ Sale updated successfully:', updatedSale);
      } else {
        console.log('🔄 Creating new sale');
        const saleId = await createSale(sanitizedSaleData);
        console.log('✅ Sale created with ID:', saleId);
      }

      console.log('✅ Sale processed successfully');
      setShowForm(false);
      setEditingSale(null);
    } catch (error) {
      console.error('❌ Error in handleSaleSubmit:', error);
      
      // Enhanced error handling and debugging
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide specific guidance for common errors
        if (errorMessage.includes('UUID') || errorMessage.includes('uuid') || errorMessage.includes('invalid input syntax')) {
          errorMessage = 'Erro de validação de dados: Verifique se todos os campos estão preenchidos corretamente. Detalhes no console.';
        } else if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
          errorMessage = 'Esta venda já existe no sistema. Verifique se não é uma duplicata.';
        } else if (errorMessage.includes('foreign key') || errorMessage.includes('not found')) {
          errorMessage = 'Dados relacionados não encontrados. Verifique se o vendedor selecionado existe.';
        }
      }
      
      // Show user-friendly error
      alert('Erro ao salvar venda: ' + errorMessage);
      
      // Log detailed error for debugging
      console.error('🔍 Detailed error information:', {
        originalError: error,
        saleData: sanitizedSaleData,
        timestamp: new Date().toISOString()
      });
    }
  };
  
  const loadDebugErrors = async () => {
    try {
      const errors = await debugService.getRecentSaleErrors(20);
      setDebugErrors(errors);
      setShowDebugErrors(true);
    } catch (error) {
      console.error('Error loading debug errors:', error);
      alert('Erro ao carregar logs de debug: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;

    try {
      await deleteSale(id);
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.observations?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'parcial': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago': return 'Pago';
      case 'pendente': return 'Pendente';
      case 'parcial': return 'Parcial';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getSellerName = (sellerId: string | null) => {
    if (!sellerId) return 'Sem vendedor';
    const seller = employees.find(emp => emp.id === sellerId);
    return seller?.name || 'Vendedor não encontrado';
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'dinheiro': return 'bg-green-100 text-green-800 border-green-200';
      case 'pix': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cartao_credito': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cartao_debito': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'cheque': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'boleto': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'transferencia': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getSaleChecks = (saleId: string) => {
    return checks.filter(check => check.saleId === saleId);
  };

  const getSaleBoletos = (saleId: string) => {
    return boletos.filter(boleto => boleto.saleId === saleId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl floating-animation">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Vendas</h1>
            <p className="text-slate-600 text-lg">Controle completo de vendas e recebimentos</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Venda
        </button>
        <button
          onClick={() => setShowDebugErrors(true)}
          className="btn-secondary flex items-center gap-2"
          title="Ver logs de erro para debug"
        >
          <AlertTriangle className="w-5 h-5" />
          Debug Logs
        </button>
        <button
          onClick={() => setShowTestPanel(true)}
          className="btn-info flex items-center gap-2"
          title="Executar testes automatizados"
        >
          <Play className="w-5 h-5" />
          Testes
        </button>
      </div>

      {/* Filters */}
      <div className="card modern-shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="parcial">Parcial</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="space-y-6">
        {filteredSales.length > 0 ? (
          filteredSales.map((sale) => {
            const saleChecks = getSaleChecks(sale.id);
            const saleBoletos = getSaleBoletos(sale.id);
            
            return (
              <div key={sale.id} className="card modern-shadow-xl">
                {/* Sale Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-600">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{sale.client}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(sale.date)}
                        </span>
                        {sale.deliveryDate && (
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            Entrega: {sale.deliveryDate ? formatDate(sale.deliveryDate) : 'Não definida'}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {getSellerName(sale.sellerId)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-black text-blue-600">
                      {formatCurrency(sale.totalValue)}
                    </p>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(sale.status)}`}>
                      {getStatusLabel(sale.status)}
                    </span>
                  </div>
                </div>

                {/* Products */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-2">Produtos</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border">
                    <p className="text-slate-700">
                      {Array.isArray(sale.products) && sale.products.length > 0
                        ? sale.products.map((p: any) => p.name).join(', ')
                        : typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'
                      }
                    </p>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-4">Métodos de Pagamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(sale.paymentMethods || []).map((method, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPaymentMethodColor(method.type)}`}>
                            {method.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xl font-black text-green-600">
                            {formatCurrency(method.amount)}
                          </span>
                        </div>
                        
                        {method.installments && method.installments > 1 && (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Parcelas:</span>
                              <span className="font-bold text-green-800">
                                {method.installments}x de {formatCurrency(method.installmentValue || 0)}
                              </span>
                            </div>
                            {method.installmentInterval && (
                              <div className="flex justify-between">
                                <span className="text-green-700">Intervalo:</span>
                                <span className="font-bold text-green-800">{method.installmentInterval} dias</span>
                              </div>
                            )}
                            {method.firstInstallmentDate && (
                              <div className="flex justify-between">
                                <span className="text-green-700">Primeira parcela:</span>
                                <span className="font-bold text-green-800">
                                  {new Date(method.firstInstallmentDate).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Third Party Check Details */}
                        {method.type === 'cheque' && method.isThirdPartyCheck && method.thirdPartyDetails && (
                          <div className="mt-4 space-y-3">
                            <h5 className="font-bold text-green-800">Cheques de Terceiros:</h5>
                            {method.thirdPartyDetails.map((checkDetail, checkIndex) => (
                              <div key={checkIndex} className="p-3 bg-white rounded-lg border border-green-100">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-bold text-green-700">Emissor:</span>
                                    <p className="text-green-600">{checkDetail.issuer}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-green-700">CPF/CNPJ:</span>
                                    <p className="text-green-600">{checkDetail.cpfCnpj}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-green-700">Banco:</span>
                                    <p className="text-green-600">{checkDetail.bank}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-green-700">Ag/Conta:</span>
                                    <p className="text-green-600">{checkDetail.agency}/{checkDetail.account}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="font-bold text-green-700">Nº Cheque:</span>
                                    <p className="text-green-600">{checkDetail.checkNumber}</p>
                                  </div>
                                  {checkDetail.observations && (
                                    <div className="col-span-2">
                                      <span className="font-bold text-green-700">Obs:</span>
                                      <p className="text-green-600">{checkDetail.observations}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cheques Gerados */}
                {saleChecks.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-yellow-600" />
                      Cheques Gerados ({saleChecks.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {saleChecks.map((check) => (
                        <div key={check.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-bold text-yellow-900">{check.client}</h5>
                              <p className="text-sm text-yellow-700">
                                Parcela {check.installmentNumber}/{check.totalInstallments}
                              </p>
                            </div>
                            <span className="text-lg font-black text-yellow-600">
                              {formatCurrency(check.value)}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-yellow-700">Vencimento:</span>
                              <span className="font-bold text-yellow-800">
                                {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-yellow-700">Status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                check.status === 'compensado' ? 'bg-green-100 text-green-800' :
                                check.status === 'devolvido' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {check.status === 'compensado' ? 'Compensado' :
                                 check.status === 'devolvido' ? 'Devolvido' :
                                 check.status === 'reapresentado' ? 'Reapresentado' : 'Pendente'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-yellow-700">Tipo:</span>
                              <span className="font-bold text-yellow-800">
                                {check.isOwnCheck ? 'Cheque Próprio' : 'Cheque de Terceiros'}
                              </span>
                            </div>
                            {check.usedFor && (
                              <div className="flex justify-between">
                                <span className="text-yellow-700">Usado para:</span>
                                <span className="font-bold text-yellow-800">{check.usedFor}</span>
                              </div>
                            )}
                            {check.observations && (
                              <div className="mt-2 p-2 bg-white rounded border">
                                <span className="text-yellow-700 font-bold">Observações:</span>
                                <p className="text-yellow-600 text-xs mt-1">{check.observations}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boletos Gerados */}
                {saleBoletos.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-cyan-600" />
                      Boletos Gerados ({saleBoletos.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {saleBoletos.map((boleto) => (
                        <div key={boleto.id} className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-bold text-cyan-900">{boleto.client}</h5>
                              <p className="text-sm text-cyan-700">
                                Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                              </p>
                            </div>
                            <span className="text-lg font-black text-cyan-600">
                              {formatCurrency(boleto.value)}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-cyan-700">Vencimento:</span>
                              <span className="font-bold text-cyan-800">
                                {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-cyan-700">Status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                boleto.status === 'compensado' ? 'bg-green-100 text-green-800' :
                                boleto.status === 'vencido' ? 'bg-red-100 text-red-800' :
                                boleto.status === 'cancelado' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {boleto.status === 'compensado' ? 'Compensado' :
                                 boleto.status === 'vencido' ? 'Vencido' :
                                 boleto.status === 'cancelado' ? 'Cancelado' :
                                 boleto.status === 'nao_pago' ? 'Não Pago' : 'Pendente'}
                              </span>
                            </div>
                            {boleto.finalAmount && boleto.finalAmount !== boleto.value && (
                              <div className="flex justify-between">
                                <span className="text-cyan-700">Valor Final:</span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(boleto.finalAmount)}
                                </span>
                              </div>
                            )}
                            {boleto.overdueAction && (
                              <div className="flex justify-between">
                                <span className="text-cyan-700">Situação:</span>
                                <span className="font-bold text-cyan-800">
                                  {boleto.overdueAction.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                            {boleto.observations && (
                              <div className="mt-2 p-2 bg-white rounded border">
                                <span className="text-cyan-700 font-bold">Observações:</span>
                                <p className="text-cyan-600 text-xs mt-1">{boleto.observations}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-4">Resumo Financeiro</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-blue-600 font-semibold">Total</p>
                      <p className="text-2xl font-black text-blue-700">
                        {formatCurrency(sale.totalValue)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-green-600 font-semibold">Recebido</p>
                      <p className="text-2xl font-black text-green-700">
                        {formatCurrency(sale.receivedAmount)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <p className="text-orange-600 font-semibold">Pendente</p>
                      <p className="text-2xl font-black text-orange-700">
                        {formatCurrency(sale.pendingAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commission Info */}
                {sale.sellerId && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-2">Informações de Comissão</h4>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-700 font-semibold">
                          Comissão ({sale.custom_commission_rate}%):
                        </span>
                        <span className="text-xl font-black text-purple-600">
                          {formatCurrency((sale.totalValue * (sale.custom_commission_rate || 0)) / 100)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Observations */}
                {sale.observations && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-2">Observações</h4>
                    <div className="p-4 bg-slate-50 rounded-xl border">
                      <p className="text-slate-700">{sale.observations}</p>
                    </div>
                  </div>
                )}

                {/* Payment Observations */}
                {sale.paymentObservations && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-2">Observações do Pagamento</h4>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-blue-700">{sale.paymentObservations}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setViewingSale(sale)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern"
                    title="Visualizar Detalhes Completos"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(sale)}
                    className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-modern"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <DollarSign className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {searchTerm || statusFilter !== 'all' ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada'}
            </h3>
            <p className="text-slate-600 mb-8 text-lg">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece registrando sua primeira venda para controlar os recebimentos.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary modern-shadow-xl"
              >
                Registrar primeira venda
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sale Form Modal */}
      {showForm && (
        <SaleForm
          sale={editingSale}
          onSubmit={handleSaleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingSale(null);
          }}
        />
      )}

      {/* View Sale Modal */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Detalhes Completos da Venda</h2>
                    <p className="text-slate-600">{viewingSale.client}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingSale(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2">Informações Básicas</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Cliente:</strong> {viewingSale.client}</p>
                      <p><strong>Data:</strong> {formatDate(viewingSale.date)}</p>
                      {viewingSale.deliveryDate && (
                        <p><strong>Entrega:</strong> {viewingSale.deliveryDate ? formatDate(viewingSale.deliveryDate) : 'Não definida'}</p>
                      )}
                      <p><strong>Vendedor:</strong> {getSellerName(viewingSale.sellerId)}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingSale.status)}`}>
                          {getStatusLabel(viewingSale.status)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">Valores</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Total:</strong> {formatCurrency(viewingSale.totalValue)}</p>
                      <p><strong>Recebido:</strong> <span className="text-green-600 font-bold">{formatCurrency(viewingSale.receivedAmount)}</span></p>
                      <p><strong>Pendente:</strong> <span className="text-orange-600 font-bold">{formatCurrency(viewingSale.pendingAmount)}</span></p>
                    </div>
                  </div>

                  {viewingSale.sellerId && (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <h4 className="font-bold text-purple-900 mb-2">Comissão</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Taxa:</strong> {viewingSale.custom_commission_rate}%</p>
                        <p><strong>Valor:</strong> 
                          <span className="text-purple-600 font-bold ml-1">
                            {formatCurrency((viewingSale.totalValue * (viewingSale.custom_commission_rate || 0)) / 100)}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Products */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4">Produtos Vendidos</h4>
                  <p className="text-slate-700 text-lg">
                    {Array.isArray(viewingSale.products) && viewingSale.products.length > 0
                      ? viewingSale.products.map((p: any) => p.name).join(', ')
                      : typeof viewingSale.products === 'string' ? viewingSale.products : 'Produtos vendidos'
                    }
                  </p>
                </div>

                {/* Payment Methods Detailed */}
                <div className="p-6 bg-green-50 rounded-2xl border border-green-200">
                  <h4 className="font-bold text-green-900 mb-4">Métodos de Pagamento Detalhados</h4>
                  <div className="space-y-4">
                    {(viewingSale.paymentMethods || []).map((method, index) => (
                      <div key={index} className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getPaymentMethodColor(method.type)}`}>
                            {method.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-2xl font-black text-green-600">
                            {formatCurrency(method.amount)}
                          </span>
                        </div>
                        
                        {method.installments && method.installments > 1 && (
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p><strong className="text-green-800">Parcelas:</strong> {method.installments}x</p>
                              <p><strong className="text-green-800">Valor por parcela:</strong> {formatCurrency(method.installmentValue || 0)}</p>
                            </div>
                            <div>
                              <p><strong className="text-green-800">Intervalo:</strong> {method.installmentInterval} dias</p>
                              {method.firstInstallmentDate && (
                                <p><strong className="text-green-800">Primeira parcela:</strong> {new Date(method.firstInstallmentDate).toLocaleDateString('pt-BR')}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Third Party Check Details */}
                        {method.type === 'cheque' && method.isThirdPartyCheck && method.thirdPartyDetails && (
                          <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                            <h5 className="font-bold text-yellow-800 mb-3">Detalhes dos Cheques de Terceiros</h5>
                            <div className="space-y-3">
                              {method.thirdPartyDetails.map((checkDetail, checkIndex) => (
                                <div key={checkIndex} className="p-3 bg-white rounded-lg border border-yellow-100">
                                  <h6 className="font-bold text-yellow-900 mb-2">Cheque {checkIndex + 1}</h6>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <p><strong>Emissor:</strong> {checkDetail.issuer}</p>
                                      <p><strong>CPF/CNPJ:</strong> {checkDetail.cpfCnpj}</p>
                                      <p><strong>Banco:</strong> {checkDetail.bank}</p>
                                    </div>
                                    <div>
                                      <p><strong>Agência:</strong> {checkDetail.agency}</p>
                                      <p><strong>Conta:</strong> {checkDetail.account}</p>
                                      <p><strong>Nº Cheque:</strong> {checkDetail.checkNumber}</p>
                                    </div>
                                    {checkDetail.observations && (
                                      <div className="col-span-2">
                                        <p><strong>Observações:</strong> {checkDetail.observations}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Observations */}
                {(viewingSale.observations || viewingSale.paymentObservations) && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">Todas as Observações</h4>
                    <div className="space-y-4">
                      {viewingSale.observations && (
                        <div>
                          <h5 className="font-bold text-slate-800 mb-2">Observações Gerais:</h5>
                          <p className="text-slate-700 p-3 bg-white rounded-lg border">{viewingSale.observations}</p>
                        </div>
                      )}
                      {viewingSale.paymentObservations && (
                        <div>
                          <h5 className="font-bold text-slate-800 mb-2">Observações do Pagamento:</h5>
                          <p className="text-slate-700 p-3 bg-white rounded-lg border">{viewingSale.paymentObservations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* System Information */}
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4">Informações do Sistema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>ID da Venda:</strong> <span className="font-mono text-xs">{viewingSale.id}</span></p>
                      <p><strong>Data de Criação:</strong> {new Date(viewingSale.createdAt).toLocaleString('pt-BR')}</p>
                      {viewingSale.updatedAt && (
                        <p><strong>Última Atualização:</strong> {new Date(viewingSale.updatedAt).toLocaleString('pt-BR')}</p>
                      )}
                    </div>
                    <div>
                      <p><strong>Cheques Gerados:</strong> {getSaleChecks(viewingSale.id).length}</p>
                      <p><strong>Boletos Gerados:</strong> {getSaleBoletos(viewingSale.id).length}</p>
                      <p><strong>Comissão Gerada:</strong> {viewingSale.sellerId ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setViewingSale(null)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <DebugPanel 
        isOpen={showDebugErrors}
        onClose={() => setShowDebugErrors(false)}
      />
      
      {/* Test Panel */}
      <TestSaleCreation
        isOpen={showTestPanel}
        onClose={() => setShowTestPanel(false)}
      />
    </div>
  );
}