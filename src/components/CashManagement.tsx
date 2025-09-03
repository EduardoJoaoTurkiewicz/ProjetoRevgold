import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Minus } from 'lucide-react';

export default function CashManagement() {
  const { cashBalance, cashTransactions } = useAppContext();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<'entrada' | 'saida'>('entrada');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const todayTransactions = cashTransactions.filter(
    transaction => new Date(transaction.date).toDateString() === new Date().toDateString()
  );

  const todayIncome = todayTransactions
    .filter(t => t.type === 'entrada')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const todayExpenses = todayTransactions
    .filter(t => t.type === 'saida')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Caixa</h1>
        <button
          onClick={() => setShowAddTransaction(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Transação
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(cashBalance?.current_balance || 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entradas Hoje</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(todayIncome)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saídas Hoje</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(todayExpenses)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo do Dia</p>
              <p className={`text-2xl font-bold ${todayIncome - todayExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(todayIncome - todayExpenses)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Transações Recentes</h2>
        </div>
        <div className="p-6">
          {cashTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma transação encontrada</p>
          ) : (
            <div className="space-y-4">
              {cashTransactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {transaction.type === 'entrada' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.category} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'entrada' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </p>
                    {transaction.payment_method && (
                      <p className="text-sm text-gray-500">{transaction.payment_method}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nova Transação</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransactionType('entrada')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      transactionType === 'entrada'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Entrada
                  </button>
                  <button
                    onClick={() => setTransactionType('saida')}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      transactionType === 'saida'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <Minus className="w-4 h-4 inline mr-2" />
                    Saída
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddTransaction(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowAddTransaction(false)}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}