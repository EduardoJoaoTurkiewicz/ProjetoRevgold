import React, { useState, useMemo } from 'react';
import { ErrorHandler } from '../lib/errorHandler';
import { safeNumber, validateFormNumber, safeCurrency, logMonetaryValues } from '../utils/numberUtils';
import { connectionManager } from '../lib/connectionManager';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Activity, 
  Wallet, 
  Plus, 
  RefreshCw, 
  Filter, 
  Search, 
  Download, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  X,
  AlertCircle,
  CreditCard,
  Receipt,
  Building2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CashTransactionForm } from './forms/CashTransactionForm';

export function CashManagement() {
  const { 
    cashBalance, 
    cashTransactions,
    sales, 
    checks, 
    boletos, 
    debts,
    employees,
    isLoading, 
    error, 
   setError,
    initializeCashBalance, 
    recalculateCashBalance, 
    loadAllData,
    createCashTransaction,
    updateCashTransaction,
    deleteCashTransaction
  } = useAppContext();
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [initialAmount, setInitialAmount] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    category: 'all',
    paymentMethod: 'all',
    type: 'all',
    searchTerm: ''
  });

  // Force reload cash balance on mount
  React.useEffect(() => {
    let mounted = true;
    
    console.log('🔄 Gestão de Caixa iniciada...');
    
    if (mounted) {
      // Data already loaded by AppContext - no need to reload here
      console.log('💰 Cash Management mounted - using data from context');
    }
    
    return () => {
      mounted = false;
    };
  }, []);

  // Calcular transações do período filtrado
  const filteredTransactions = useMemo(() => {
    return cashTransactions.filter(transaction => {
      const transactionDate = transaction.date;
      const matchesDateRange = transactionDate >= filters.startDate && transactionDate <= filters.endDate;
      const matchesCategory = filters.category === 'all' || transaction.category === filters.category;
      const matchesPaymentMethod = filters.paymentMethod === 'all' || transaction.paymentMethod === filters.paymentMethod;
      const matchesType = filters.type === 'all' || transaction.type === filters.type;
      const matchesSearch = !filters.searchTerm || 
        transaction.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      return matchesDateRange && matchesCategory && matchesPaymentMethod && matchesType && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashTransactions, filters]);

  // Calcular totais do período
  const periodTotals = useMemo(() => {
    const entrada = filteredTransactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + safeNumber(t.amount, 0), 0);
    const saida = filteredTransactions.filter(t => t.type === 'saida').reduce((sum, t) => sum + safeNumber(t.amount, 0), 0);
    const saldo = entrada - saida;
    
    return { entrada, saida, saldo };
  }, [filteredTransactions]);

  const handleInitializeCash = async (e) => {
    e.preventDefault();
    
    const validAmount = safeNumber(initialAmount, 0);
    if (validAmount <= 0) {
      alert('O valor inicial deve ser maior que zero.');
      return;
    }
    
    setIsInitializing(true);
    
    try {
      console.log('🔄 Inicializando caixa com valor:', validAmount);
      logMonetaryValues({ initialAmount: validAmount }, 'Initialize Cash');
      await initializeCashBalance(validAmount);
      console.log('✅ Caixa inicializado com sucesso');
      
      // Forçar recarregamento dos dados
      await loadAllData();
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Initialize Cash');
      const errorMessage = error?.message ?? 'Erro desconhecido';
      alert('Erro ao inicializar caixa: ' + ErrorHandler.handleSupabaseError(error));
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRecalculateBalance = async () => {
    if (!cashBalance) {
      alert('Caixa não foi inicializado ainda.');
      return;
    }
    
    setIsRecalculating(true);
    try {
      console.log('🔄 Recalculando saldo...');
      await recalculateCashBalance();
      console.log('✅ Saldo recalculado com sucesso');
      
      // Forçar recarregamento dos dados
      await loadAllData();
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Recalculate Balance');
      const errorMessage = error?.message ?? 'Erro desconhecido';
     setError('Erro ao recalcular saldo: ' + ErrorHandler.handleSupabaseError(error));
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleTransactionSubmit = async (transactionData) => {
    try {
      if (editingTransaction) {
        await updateCashTransaction({
          ...transactionData,
          id: editingTransaction.id,
          createdAt: editingTransaction.createdAt
        });
      } else {
        await createCashTransaction(transactionData);
      }

      setShowTransactionForm(false);
      setEditingTransaction(null);
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Save Transaction');
      alert('Erro ao salvar transação: ' + ErrorHandler.handleSupabaseError(error));
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      await deleteCashTransaction(id);
    } catch (error) {
      ErrorHandler.logProjectError(error, 'Delete Transaction');
      alert('Erro ao excluir transação: ' + ErrorHandler.handleSupabaseError(error));
    }
  };

  const getRelatedInfo = (transaction) => {
    if (!transaction.relatedId) return null;
    
    // Buscar em vendas
    const sale = sales.find(s => s.id === transaction.relatedId);
    if (sale) return { type: 'venda', data: sale, icon: DollarSign, label: sale.client };
    
    // Buscar em cheques
    const check = checks.find(c => c.id === transaction.relatedId);
    if (check) return { type: 'cheque', data: check, icon: FileText, label: check.client };
    
    // Buscar em boletos
    const boleto = boletos.find(b => b.id === transaction.relatedId);
    if (boleto) return { type: 'boleto', data: boleto, icon: Receipt, label: boleto.client };
    
    // Buscar em dívidas
    const debt = debts.find(d => d.id === transaction.relatedId);
    if (debt) return { type: 'divida', data: debt, icon: CreditCard, label: debt.company };
    
    return null;
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'venda': return 'bg-green-100 text-green-800 border-green-200';
      case 'divida': return 'bg-red-100 text-red-800 border-red-200';
      case 'salario': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'adiantamento': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'comissao': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cheque': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'boleto': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method?.toLowerCase()) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando dados do caixa...</p>
        </div>
      </div>
    );
  }

  // Se não há saldo inicial, mostrar formulário de inicialização
  if (!cashBalance) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 shadow-xl floating-animation">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gestão de Caixa</h1>
              <p className="text-slate-600 text-lg">Controle completo do fluxo de caixa da empresa</p>
            </div>
          </div>
        </div>

        <div className="card modern-shadow-xl max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Inicializar Caixa
            </h2>
            <p className="text-slate-600 text-lg">
              Para começar a usar o sistema de caixa, informe o valor atual em caixa da empresa.
            </p>
          </div>

          <form onSubmit={handleInitializeCash} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Valor Atual em Caixa *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(safeNumber(e.target.value, 0))}
                className="input-field text-center text-2xl font-bold"
                placeholder="0,00"
                required
              />
              <p className="text-sm text-slate-500 mt-2">
                Este será o valor base do seu caixa. Todas as transações futuras serão calculadas a partir deste valor.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">Como funciona?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>ENTRADAS:</strong> Toda venda em dinheiro, PIX, débito ou crédito à vista aumenta o saldo</li>
                <li>• <strong>ENTRADAS:</strong> Cheques de terceiros compensados aumentam o saldo</li>
                <li>• <strong>ENTRADAS:</strong> Boletos recebidos aumentam o saldo</li>
                <li>• <strong>SAÍDAS:</strong> Pagamentos de dívidas diminuem o saldo</li>
                <li>• <strong>SAÍDAS:</strong> Salários e adiantamentos diminuem o saldo</li>
                <li>• <strong>SAÍDAS:</strong> Impostos e tarifas diminuem o saldo</li>
                <li>• <strong>MATEMÁTICA EXATA:</strong> Saldo sempre reflete a realidade financeira</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isInitializing}
              className="btn-primary w-full"
            >
              {isInitializing ? 'Inicializando...' : 'Inicializar Caixa'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 shadow-xl floating-animation">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Caixa</h1>
            <p className="text-slate-600 text-lg">Controle completo do fluxo de caixa da empresa</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRecalculateBalance}
            disabled={isRecalculating}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculando...' : 'Recalcular'}
          </button>
          <button
            onClick={() => setShowTransactionForm(true)}
            className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Saldo Atual</h3>
              <p className={`text-3xl font-black ${cashBalance.currentBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {safeCurrency(cashBalance.currentBalance)}
              </p>
              <p className="text-sm text-green-600 font-semibold">
                Atualizado automaticamente
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-600 modern-shadow-lg">
              <ArrowUpCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-lg">Entradas</h3>
              <p className="text-3xl font-black text-emerald-700">
                {safeCurrency(periodTotals.entrada)}
              </p>
              <p className="text-sm text-emerald-600 font-semibold">
                {filteredTransactions.filter(t => t.type === 'entrada').length} transação(ões)
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-600 modern-shadow-lg">
              <ArrowDownCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Saídas</h3>
              <p className="text-3xl font-black text-red-700">
                {safeCurrency(periodTotals.saida)}
              </p>
              <p className="text-sm text-red-600 font-semibold">
                {filteredTransactions.filter(t => t.type === 'saida').length} transação(ões)
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Saldo Inicial</h3>
              <p className="text-3xl font-black text-blue-700">
                {safeCurrency(cashBalance.initialBalance)}
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                {cashBalance.initialDate && new Date(cashBalance.initialDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="form-label">Data Inicial</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="form-label">Data Final</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="form-label">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">Categoria</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="input-field"
            >
              <option value="all">Todas</option>
              <option value="venda">Venda</option>
              <option value="divida">Dívida</option>
              <option value="salario">Salário</option>
              <option value="adiantamento">Adiantamento</option>
              <option value="comissao">Comissão</option>
              <option value="cheque">Cheque</option>
              <option value="boleto">Boleto</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">Forma de Pagamento</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="input-field"
            >
              <option value="all">Todas</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="cheque">Cheque</option>
              <option value="boleto">Boleto</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Activity className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900">Transações do Caixa</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {/* TODO: Export functionality */}}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
        
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto modern-scrollbar">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Data</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Tipo</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Descrição</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Categoria</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Pagamento</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Referência</th>
                  <th className="text-right py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Valor</th>
                  <th className="text-left py-4 px-6 font-bold text-slate-700 bg-gradient-to-r from-green-50 to-emerald-50">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => {
                  const relatedInfo = getRelatedInfo(transaction);
                  
                  return (
                    <tr key={transaction.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 transition-all duration-300">
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          transaction.type === 'entrada' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {transaction.type === 'entrada' ? 'ENTRADA' : 'SAÍDA'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-700">
                        <div className="max-w-64 truncate">{transaction.description}</div>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(transaction.category)}`}>
                          {transaction.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {transaction.paymentMethod && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPaymentMethodColor(transaction.paymentMethod)}`}>
                            {transaction.paymentMethod.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {relatedInfo ? (
                          <div className="flex items-center gap-2">
                            <relatedInfo.icon className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-600 font-medium truncate max-w-32">
                              {relatedInfo.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm font-black text-right">
                        <span className={transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'entrada' ? '+' : '-'}{safeCurrency(safeNumber(transaction.amount, 0))}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-modern"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTransaction(transaction);
                              setShowTransactionForm(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-modern"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
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
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 floating-animation">
              <Activity className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {filters.searchTerm || filters.category !== 'all' || filters.type !== 'all' 
                ? 'Nenhuma transação encontrada' 
                : 'Nenhuma transação registrada'
              }
            </h3>
            <p className="text-slate-600 mb-8 text-lg">
              {filters.searchTerm || filters.category !== 'all' || filters.type !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'As transações aparecerão aqui conforme as operações do sistema.'
              }
            </p>
            {!filters.searchTerm && filters.category === 'all' && filters.type === 'all' && (
              <button
                onClick={() => setShowTransactionForm(true)}
                className="btn-primary modern-shadow-xl"
              >
                Registrar primeira transação
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <CashTransactionForm
          transaction={editingTransaction}
          onSubmit={handleTransactionSubmit}
          onCancel={() => {
            setShowTransactionForm(false);
            setEditingTransaction(null);
          }}
        />
      )}

      {/* View Transaction Modal */}
      {viewingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modern-shadow-xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Detalhes da Transação</h2>
                </div>
                <button
                  onClick={() => setViewingTransaction(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="form-label">Data</label>
                  <p className="text-sm text-slate-900 font-semibold">
                    {new Date(viewingTransaction.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="form-label">Tipo</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    viewingTransaction.type === 'entrada' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {viewingTransaction.type === 'entrada' ? 'ENTRADA' : 'SAÍDA'}
                  </span>
                </div>
                <div>
                  <label className="form-label">Valor</label>
                  <p className={`text-xl font-black ${
                    viewingTransaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {viewingTransaction.type === 'entrada' ? '+' : '-'}R$ {viewingTransaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="form-label">Categoria</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(viewingTransaction.category)}`}>
                    {viewingTransaction.category.toUpperCase()}
                  </span>
                </div>
                {viewingTransaction.paymentMethod && (
                  <div>
                    <label className="form-label">Forma de Pagamento</label>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPaymentMethodColor(viewingTransaction.paymentMethod)}`}>
                      {viewingTransaction.paymentMethod.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="form-label">Descrição</label>
                  <p className="text-sm text-slate-900 font-medium">{viewingTransaction.description}</p>
                </div>
              </div>

              {getRelatedInfo(viewingTransaction) && (
                <div className="mb-8">
                  <label className="form-label">Referência</label>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      {React.createElement(getRelatedInfo(viewingTransaction).icon, { className: "w-6 h-6 text-blue-600" })}
                      <div>
                        <p className="font-bold text-blue-900">{getRelatedInfo(viewingTransaction).label}</p>
                        <p className="text-sm text-blue-700">Tipo: {getRelatedInfo(viewingTransaction).type}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setViewingTransaction(null)}
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