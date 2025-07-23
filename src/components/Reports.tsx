import React from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Receipt } from 'lucide-react';

export const Reports: React.FC = () => {
  const { state } = useApp();
  const { sales, debts, checks, employees, boletos } = state;

  const today = new Date().toDateString();
  
  // Recebimentos de hoje
  const todayReceipts = [
    ...sales.filter(sale => new Date(sale.date).toDateString() === today),
    ...checks.filter(check => new Date(check.dueDate).toDateString() === today && check.status === 'compensado')
  ];

  // Gastos de hoje
  const todayExpenses = [
    ...debts.filter(debt => new Date(debt.date).toDateString() === today),
    ...state.employeePayments.filter(payment => new Date(payment.paymentDate).toDateString() === today)
  ];

  const totalReceipts = todayReceipts.reduce((sum, item) => {
    if ('totalValue' in item) return sum + item.totalValue;
    if ('value' in item) return sum + item.value;
    return sum;
  }, 0);

  const totalExpenses = todayExpenses.reduce((sum, item) => {
    if ('totalValue' in item) return sum + item.totalValue;
    if ('amount' in item) return sum + item.amount;
    return sum;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4">
          <Receipt className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-emerald-100 text-lg">Análise financeira detalhada</p>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recebimentos de Hoje */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Recebimentos de Hoje</h3>
            </div>
            <span className="text-2xl font-bold text-green-600">
              R$ {totalReceipts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="space-y-3">
            {todayReceipts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum recebimento hoje</p>
            ) : (
              todayReceipts.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">
                      {'client' in item ? item.client : 'Cliente'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {'products' in item ? 'Venda' : 'Cheque'}
                    </p>
                  </div>
                  <span className="font-bold text-green-600">
                    R$ {('totalValue' in item ? item.totalValue : item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Gastos de Hoje */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Gastos de Hoje</h3>
            </div>
            <span className="text-2xl font-bold text-red-600">
              R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="space-y-3">
            {todayExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum gasto hoje</p>
            ) : (
              todayExpenses.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">
                      {'company' in item ? item.company : 'Pagamento'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {'description' in item ? item.description : 'Salário'}
                    </p>
                  </div>
                  <span className="font-bold text-red-600">
                    R$ {('totalValue' in item ? item.totalValue : item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Relatórios Detalhados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendas do Mês */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Vendas do Mês</h3>
          </div>
          
          <div className="space-y-3">
            {sales.slice(0, 5).map((sale, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{sale.client}</p>
                  <p className="text-sm text-gray-600">
                    {Array.isArray(sale.products) 
                      ? sale.products.map(p => p.name).join(', ')
                      : 'Produtos'}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="font-bold text-blue-600">
                  R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dívidas Pendentes */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Dívidas Pendentes</h3>
          </div>
          
          <div className="space-y-3">
            {debts.filter(debt => !debt.isPaid).slice(0, 5).map((debt, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{debt.company}</p>
                  <p className="text-sm text-gray-600">{debt.description}</p>
                  <p className="text-xs text-gray-500">Data: {new Date(debt.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="font-bold text-orange-600">
                  R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumo Mensal */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Resumo Mensal</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {sales.length}
            </p>
            <p className="text-gray-600">Vendas</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">
              {debts.length}
            </p>
            <p className="text-gray-600">Dívidas</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {checks.length}
            </p>
            <p className="text-gray-600">Cheques</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {employees.length}
            </p>
            <p className="text-gray-600">Funcionários</p>
          </div>
        </div>
      </div>
    </div>
  );
};