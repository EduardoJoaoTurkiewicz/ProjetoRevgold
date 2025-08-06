import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Receipt
} from 'lucide-react';

export default function Dashboard() {
  const { state } = useApp();

  const today = new Date().toISOString().split('T')[0];
  
  // Vendas de hoje
  const todaySales = state.sales.filter(sale => sale.date === today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
  const todaySalesCount = todaySales.length;

  // Dívidas de hoje
  const todayDebts = state.debts.filter(debt => debt.date === today);
  const todayDebtsPaid = todayDebts.filter(debt => debt.isPaid);
  const todayDebtsCreated = todayDebts.length;
  const todayDebtsPaidValue = todayDebtsPaid.reduce((sum, debt) => sum + debt.paidAmount, 0);
  const todayDebtsCreatedValue = todayDebts.reduce((sum, debt) => sum + debt.totalValue, 0);

  // Pagamentos de funcionários hoje
  const todayEmployeePayments = state.employeePayments.filter(payment => payment.paymentDate === today);
  const todayEmployeePaymentsValue = todayEmployeePayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Total gasto hoje (dívidas + funcionários)
  const todayTotalExpenses = todayDebtsPaidValue + todayEmployeePaymentsValue;

  // Dívidas que vencem hoje
  const debtsExpireToday = state.debts.filter(debt => {
    return debt.paymentMethods.some(method => {
      if (method.startDate === today) return true;
      if (method.installments && method.installments > 1) {
        const startDate = new Date(method.startDate || debt.date);
        for (let i = 0; i < method.installments; i++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
          if (dueDate.toISOString().split('T')[0] === today) return true;
        }
      }
      return false;
    });
  });
  const debtsExpireTodayValue = debtsExpireToday.reduce((sum, debt) => sum + debt.pendingAmount, 0);

  // Cheques que vencem hoje
  const checksExpireToday = state.checks.filter(check => check.dueDate === today && check.status === 'pendente');
  const checksExpireTodayValue = checksExpireToday.reduce((sum, check) => sum + check.value, 0);

  // Funcionários que devem receber hoje
  const employeesToPayToday = state.employees.filter(employee => {
    if (!employee.isActive) return false;
    
    if (employee.nextPaymentDate === today) return true;
    
    const today_date = new Date();
    return today_date.getDate() === employee.paymentDay;
  });

  const stats = [
    {
      title: 'Valor Recebido Hoje',
      value: `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${todaySalesCount} venda(s)`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Valor Gasto Hoje',
      value: `R$ ${todayTotalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `Dívidas + Funcionários`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Dívidas Pagas Hoje',
      value: `R$ ${todayDebtsPaidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${todayDebtsPaid.length} dívida(s)`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Dívidas Feitas Hoje',
      value: `R$ ${todayDebtsCreatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${todayDebtsCreated} nova(s)`,
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Dívidas a Vencer Hoje',
      value: `R$ ${debtsExpireTodayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${debtsExpireToday.length} dívida(s)`,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      title: 'Cheques Vencem Hoje',
      value: `R$ ${checksExpireTodayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${checksExpireToday.length} cheque(s)`,
      icon: Receipt,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  const alerts = [
    ...(checksExpireToday.length > 0 ? [{
      message: `${checksExpireToday.length} cheque(s) vencem hoje`,
      type: 'warning' as const
    }] : []),
    ...(debtsExpireToday.length > 0 ? [{
      message: `${debtsExpireToday.length} dívida(s) vencem hoje`,
      type: 'warning' as const
    }] : []),
    ...(employeesToPayToday.length > 0 ? [{
      message: `${employeesToPayToday.length} funcionário(s) devem receber hoje`,
      type: 'info' as const
    }] : [])
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-green-800 mb-2">Dashboard</h1>
        <p className="text-green-600 text-lg font-semibold">
          Visão geral do seu negócio - {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`revgold-card-premium p-6 border-l-4 ${stat.borderColor} hover:scale-105 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-sm text-slate-600 font-medium">{stat.subtitle}</p>
                </div>
              </div>
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{stat.title}</h3>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="revgold-card-premium p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <AlertCircle className="w-6 h-6 mr-3 text-amber-500" />
            Alertas Importantes
          </h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-l-4 ${
                  alert.type === 'error'
                    ? 'bg-red-50 border-red-400 text-red-700'
                    : alert.type === 'warning'
                    ? 'bg-amber-50 border-amber-400 text-amber-700'
                    : 'bg-blue-50 border-blue-400 text-blue-700'
                }`}
              >
                <p className="font-semibold">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Sales */}
        <div className="revgold-card-premium p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <DollarSign className="w-6 h-6 mr-3 text-green-600" />
            Vendas de Hoje
          </h2>
          {todaySales.length > 0 ? (
            <div className="space-y-3">
              {todaySales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl border border-green-200">
                  <div>
                    <p className="font-bold text-green-900">{sale.client}</p>
                    <p className="text-sm text-green-700">
                      {Array.isArray(sale.products) 
                        ? sale.products.map(p => `${p.quantity}x ${p.name}`).join(', ')
                        : sale.products}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      sale.status === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                      sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {sale.status === 'pago' ? 'Pago' :
                       sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">Nenhuma venda hoje</p>
          )}
        </div>

        {/* Today's Expenses */}
        <div className="revgold-card-premium p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <TrendingDown className="w-6 h-6 mr-3 text-red-600" />
            Gastos de Hoje
          </h2>
          <div className="space-y-4">
            {/* Dívidas pagas hoje */}
            {todayDebtsPaid.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Dívidas Pagas</h3>
                <div className="space-y-2">
                  {todayDebtsPaid.map((debt) => (
                    <div key={debt.id} className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-900">{debt.company}</p>
                        <p className="text-sm text-red-700">{debt.description}</p>
                      </div>
                      <p className="font-bold text-red-600">
                        R$ {debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagamentos de funcionários hoje */}
            {todayEmployeePayments.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Pagamentos de Funcionários</h3>
                <div className="space-y-2">
                  {todayEmployeePayments.map((payment) => {
                    const employee = state.employees.find(e => e.id === payment.employeeId);
                    return (
                      <div key={payment.id} className="flex justify-between items-center py-2 px-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div>
                          <p className="font-medium text-purple-900">{employee?.name || 'Funcionário'}</p>
                          <p className="text-sm text-purple-700">{employee?.position || 'Cargo'}</p>
                        </div>
                        <p className="font-bold text-purple-600">
                          R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {todayDebtsPaid.length === 0 && todayEmployeePayments.length === 0 && (
              <p className="text-slate-500 text-center py-8">Nenhum gasto hoje</p>
            )}
          </div>
        </div>
      </div>

      {/* Employees to Pay Today */}
      {employeesToPayToday.length > 0 && (
        <div className="revgold-card-premium p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <Users className="w-6 h-6 mr-3 text-blue-600" />
            Funcionários para Pagar Hoje
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeesToPayToday.map((employee) => (
              <div key={employee.id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-blue-900">{employee.name}</h3>
                  <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">
                    Dia {employee.paymentDay}
                  </span>
                </div>
                <p className="text-sm text-blue-700 mb-2">{employee.position}</p>
                <p className="font-bold text-blue-600">
                  R$ {employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {employee.nextPaymentDate === today && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    ⚠️ Data específica definida
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Summary */}
      <div className="revgold-card-premium p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-green-600" />
          Resumo Geral
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-green-600">{state.sales.length}</p>
            <p className="text-slate-600 font-medium">Total Vendas</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-600">{state.debts.length}</p>
            <p className="text-slate-600 font-medium">Total Dívidas</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">{state.checks.length}</p>
            <p className="text-slate-600 font-medium">Total Cheques</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-600">{state.employees.filter(e => e.isActive).length}</p>
            <p className="text-slate-600 font-medium">Funcionários Ativos</p>
          </div>
        </div>
      </div>
    </div>
  );
}