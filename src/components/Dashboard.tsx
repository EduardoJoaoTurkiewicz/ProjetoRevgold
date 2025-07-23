import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Users, Calendar, Clock, AlertTriangle, CheckCircle, CreditCard, Receipt, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const { state } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate metrics
  const totalSales = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const totalDebts = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
  const totalReceived = state.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const totalPending = state.sales.reduce((sum, sale) => sum + sale.pendingAmount, 0);

  // Calculate today's expenses
  const todayExpenses = state.debts
    .filter(debt => debt.date === today)
    .reduce((sum, debt) => sum + debt.totalValue, 0) +
    state.employeePayments
    .filter(payment => payment.paymentDate === today)
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Today's items
  const todayChecks = state.checks.filter(check => check.dueDate === today);
  const todayBoletos = state.boletos.filter(boleto => boleto.dueDate === today);
  const todayInstallments = state.installments.filter(installment => installment.dueDate === today);

  // Overdue items
  const overdueChecks = state.checks.filter(check => check.dueDate < today && check.status === 'pendente');
  const overdueBoletos = state.boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');
  const overdueInstallments = state.installments.filter(installment => installment.dueDate < today && !installment.isPaid);

  // Employee payments due today
  const employeesPaymentDueToday = state.employees.filter(employee => {
    if (!employee.isActive) return false;
    const paymentDay = employee.paymentDay;
    return currentTime.getDate() === paymentDay;
  });

  // Chart data for sales over time
  const salesChartData = state.sales
    .slice(-7)
    .map(sale => ({
      date: new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: sale.totalValue
    }));

  // Pie chart data for payment methods
  const paymentMethodsData = state.sales.reduce((acc, sale) => {
    sale.paymentMethods.forEach(method => {
      const existing = acc.find(item => item.name === method.type);
      if (existing) {
        existing.value += method.amount;
      } else {
        acc.push({
          name: method.type.replace('_', ' ').toUpperCase(),
          value: method.amount
        });
      }
    });
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header with greeting and time */}
      <div className="card bg-gradient-to-r from-emerald-800 to-emerald-900 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-xl shadow-xl">
              <img 
                src="/image.png" 
                alt="RevGold Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {getGreeting()}, {state.user?.username}!
              </h1>
              <p className="text-emerald-100 text-lg">
                Bem-vindo ao seu painel de controle financeiro
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-emerald-200 mb-2">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="text-lg font-medium">
                {currentTime.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center text-emerald-200">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-lg font-medium">
                {currentTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-bold uppercase tracking-wide">Total em Vendas</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-blue-700 text-sm mt-1">{state.sales.length} vendas registradas</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-700 shadow-xl">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-sm font-bold uppercase tracking-wide">Recebido</p>
              <p className="text-3xl font-bold text-emerald-900 mt-2">
                R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-emerald-700 text-sm mt-1">
                {((totalReceived / totalSales) * 100 || 0).toFixed(1)}% do total
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-700 shadow-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-bold uppercase tracking-wide">Pendente</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">
                R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-orange-700 text-sm mt-1">
                {((totalPending / totalSales) * 100 || 0).toFixed(1)}% do total
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-700 shadow-xl">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-bold uppercase tracking-wide">Gasto Hoje</p>
              <p className="text-3xl font-bold text-red-900 mt-2">
                R$ {todayExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-red-700 text-sm mt-1">Gastos de hoje</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-600 shadow-xl">
              <Minus className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-bold uppercase tracking-wide">Total em Dívidas</p>
              <p className="text-3xl font-bold text-red-900 mt-2">
                R$ {totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-red-700 text-sm mt-1">{state.debts.length} dívidas registradas</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-700 shadow-xl">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(todayChecks.length > 0 || todayBoletos.length > 0 || todayInstallments.length > 0 || 
        overdueChecks.length > 0 || overdueBoletos.length > 0 || overdueInstallments.length > 0 ||
        employeesPaymentDueToday.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Items */}
          {(todayChecks.length > 0 || todayBoletos.length > 0 || todayInstallments.length > 0 || employeesPaymentDueToday.length > 0) && (
            <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-emerald-700 shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900">Vencimentos de Hoje</h3>
                  <p className="text-emerald-700">
                    {todayChecks.length + todayBoletos.length + todayInstallments.length + employeesPaymentDueToday.length} item(s) para hoje
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {todayChecks.map(check => (
                  <div key={`check-${check.id}`} className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-emerald-700" />
                      <div>
                        <p className="font-medium text-emerald-900">Cheque - {check.client}</p>
                        <p className="text-sm text-emerald-700">{check.usedFor || 'Não especificado'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-900">
                      R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                
                {todayBoletos.map(boleto => (
                  <div key={`boleto-${boleto.id}`} className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-emerald-700" />
                      <div>
                        <p className="font-medium text-emerald-900">Boleto - {boleto.client}</p>
                        <p className="text-sm text-emerald-700">Parcela {boleto.installmentNumber}/{boleto.totalInstallments}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-900">
                      R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                
                {todayInstallments.map(installment => (
                  <div key={`installment-${installment.id}`} className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-emerald-700" />
                      <div>
                        <p className="font-medium text-emerald-900">Parcela - {installment.description}</p>
                        <p className="text-sm text-emerald-700">Tipo: {installment.type === 'venda' ? 'Venda' : 'Dívida'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-900">
                      R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                
                {employeesPaymentDueToday.map(employee => (
                  <div key={`employee-${employee.id}`} className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-emerald-700" />
                      <div>
                        <p className="font-medium text-emerald-900">Pagamento - {employee.name}</p>
                        <p className="text-sm text-emerald-700">{employee.position}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-900">
                      R$ {employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Items */}
          {(overdueChecks.length > 0 || overdueBoletos.length > 0 || overdueInstallments.length > 0) && (
            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-red-600 shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Itens Vencidos</h3>
                  <p className="text-red-700">
                    {overdueChecks.length + overdueBoletos.length + overdueInstallments.length} item(s) em atraso
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {overdueChecks.map(check => (
                  <div key={`overdue-check-${check.id}`} className="flex justify-between items-center p-3 bg-white rounded-xl border border-red-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Cheque - {check.client}</p>
                        <p className="text-sm text-red-700">Venceu em {new Date(check.dueDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className="font-bold text-red-900">
                      R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                
                {overdueBoletos.map(boleto => (
                  <div key={`overdue-boleto-${boleto.id}`} className="flex justify-between items-center p-3 bg-white rounded-xl border border-red-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Boleto - {boleto.client}</p>
                        <p className="text-sm text-red-700">Venceu em {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className="font-bold text-red-900">
                      R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                
                {overdueInstallments.map(installment => (
                  <div key={`overdue-installment-${installment.id}`} className="flex justify-between items-center p-3 bg-white rounded-xl border border-red-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Parcela - {installment.description}</p>
                        <p className="text-sm text-red-700">Venceu em {new Date(installment.dueDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className="font-bold text-red-900">
                      R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-emerald-700 shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Vendas dos Últimos 7 Dias</h3>
              <p className="text-slate-600">Evolução das vendas recentes</p>
            </div>
          </div>
          
          {salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                  labelStyle={{ color: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#047857" 
                  strokeWidth={3}
                  dot={{ fill: '#047857', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#047857', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Nenhuma venda registrada ainda</p>
                <p className="text-sm">Os dados aparecerão aqui quando você registrar vendas</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Methods Chart */}
        <div className="card shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-emerald-700 shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Métodos de Pagamento</h3>
              <p className="text-slate-600">Distribuição por tipo de pagamento</p>
            </div>
          </div>
          
          {paymentMethodsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                  contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Nenhum método de pagamento registrado</p>
                <p className="text-sm">Os dados aparecerão aqui quando você registrar vendas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-bold uppercase tracking-wide">Cheques</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">{state.checks.length}</p>
              <p className="text-purple-700 text-sm mt-1">
                {state.checks.filter(c => c.status === 'pendente').length} pendentes
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-600 shadow-lg">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm font-bold uppercase tracking-wide">Boletos</p>
              <p className="text-2xl font-bold text-indigo-900 mt-2">{state.boletos.length}</p>
              <p className="text-indigo-700 text-sm mt-1">
                {state.boletos.filter(b => b.status === 'pendente').length} pendentes
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-600 shadow-lg">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-600 text-sm font-bold uppercase tracking-wide">Funcionários</p>
              <p className="text-2xl font-bold text-teal-900 mt-2">
                {state.employees.filter(e => e.isActive).length}
              </p>
              <p className="text-teal-700 text-sm mt-1">ativos</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-700 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-bold uppercase tracking-wide">Parcelas</p>
              <p className="text-2xl font-bold text-amber-900 mt-2">{state.installments.length}</p>
              <p className="text-amber-700 text-sm mt-1">
                {state.installments.filter(i => !i.isPaid).length} pendentes
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-700 shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {(todayChecks.length === 0 && todayBoletos.length === 0 && todayInstallments.length === 0 && 
        overdueChecks.length === 0 && overdueBoletos.length === 0 && overdueInstallments.length === 0 &&
        employeesPaymentDueToday.length === 0) && (
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="p-4 rounded-full bg-emerald-700 shadow-xl mx-auto mb-4 w-fit">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-900 mb-2">Tudo em Dia!</h3>
              <p className="text-emerald-700 text-lg">
                Não há vencimentos para hoje nem itens em atraso. Parabéns pela organização!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}