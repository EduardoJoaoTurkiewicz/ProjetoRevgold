import React from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { state } = useApp();

  // Calculate summary statistics
  const totalSales = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalDebts = state.debts.reduce((sum, debt) => sum + debt.amount, 0);
  const totalChecks = state.checks.reduce((sum, check) => sum + check.amount, 0);
  const totalBoletos = state.boletos.reduce((sum, boleto) => sum + boleto.amount, 0);

  const pendingInstallments = state.installments.filter(inst => !inst.paid).length;
  const overdueChecks = state.checks.filter(check => 
    new Date(check.dueDate) < new Date() && check.status === 'pending'
  ).length;

  const stats = [
    {
      title: 'Total em Vendas',
      value: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total em Dívidas',
      value: `R$ ${totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Total em Cheques',
      value: `R$ ${totalChecks.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total em Boletos',
      value: `R$ ${totalBoletos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const alerts = [
    ...(overdueChecks > 0 ? [{
      message: `${overdueChecks} cheque(s) em atraso`,
      type: 'error' as const
    }] : []),
    ...(pendingInstallments > 0 ? [{
      message: `${pendingInstallments} parcela(s) pendente(s)`,
      type: 'warning' as const
    }] : [])
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu negócio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-amber-500" />
            Alertas
          </h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'error'
                    ? 'bg-red-50 border-red-400 text-red-700'
                    : 'bg-amber-50 border-amber-400 text-amber-700'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendas Recentes</h2>
          {state.sales.length > 0 ? (
            <div className="space-y-3">
              {state.sales.slice(-5).reverse().map((sale) => (
                <div key={sale.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{sale.client}</p>
                    <p className="text-sm text-gray-500">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <p className="font-semibold text-green-600">
                    R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma venda registrada</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Funcionários</h2>
          {state.employees.length > 0 ? (
            <div className="space-y-3">
              {state.employees.map((employee) => (
                <div key={employee.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-500">{employee.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      R$ {employee.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-500">Salário</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhum funcionário cadastrado</p>
          )}
        </div>
      </div>
    </div>
  );
}