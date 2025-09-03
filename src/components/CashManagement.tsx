import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Minus, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { fmtBRL, fmtDate } from '../utils/format';

interface CashTransaction {
  id: string;
  date: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  category: string;
  payment_method?: string;
  created_at: string;
}

interface CashBalance {
  id: string;
  current_balance: number;
  initial_balance: number;
  initial_date: string;
  last_updated: string;
}

export default function CashManagement() {
  const { supabase } = useAppContext();
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [balance, setBalance] = useState<CashBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [newTransaction, setNewTransaction] = useState({
    type: 'entrada' as 'entrada' | 'saida',
    amount: '',
    description: '',
    category: 'outro',
    payment_method: 'dinheiro',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { value: 'venda', label: 'Venda' },
    { value: 'divida', label: 'Dívida' },
    { value: 'adiantamento', label: 'Adiantamento' },
    { value: 'salario', label: 'Salário' },
    { value: 'comissao', label: 'Comissão' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'outro', label: 'Outro' }
  ];

  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'PIX' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'cartao_debito', label: 'Cartão Débito' },
    { value: 'cartao_credito', label: 'Cartão Crédito' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'boleto', label: 'Boleto' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch cash balance
      const { data: balanceData } = await supabase
        .from('cash_balances')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (balanceData) {
        setBalance(balanceData);
      }

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);

      if (transactionsData) {
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Error fetching cash data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTransaction.amount || !newTransaction.description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const { error } = await supabase
        .from('cash_transactions')
        .insert([{
          type: newTransaction.type,
          amount: parseFloat(newTransaction.amount),
          description: newTransaction.description,
          category: newTransaction.category,
          payment_method: newTransaction.payment_method,
          date: newTransaction.date
        }]);

      if (error) throw error;

      // Reset form
      setNewTransaction({
        type: 'entrada',
        amount: '',
        description: '',
        category: 'outro',
        payment_method: 'dinheiro',
        date: new Date().toISOString().split('T')[0]
      });

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao adicionar transação.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Caixa</h1>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showBalance ? 'Ocultar Saldo' : 'Mostrar Saldo'}
        </button>
      </div>

      {/* Balance Card */}
      {balance && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Saldo Atual</p>
              <p className="text-3xl font-bold">
                {showBalance ? fmtBRL(balance.current_balance) : '••••••'}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-blue-100">
            <span>Última atualização: {fmtDate(balance.last_updated)}</span>
          </div>
        </div>
      )}

      {/* Add Transaction Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nova Transação</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={newTransaction.type}
                onChange={(e) => setNewTransaction(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'entrada' | 'saida' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição da transação"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={newTransaction.category}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pagamento
              </label>
              <select
                value={newTransaction.payment_method}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, payment_method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {newTransaction.type === 'entrada' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            Adicionar {newTransaction.type === 'entrada' ? 'Entrada' : 'Saída'}
          </button>
        </form>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Transações Recentes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fmtDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {transaction.type === 'entrada' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {categories.find(c => c.value === transaction.category)?.label || transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'entrada' ? '+' : '-'}{fmtBRL(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}