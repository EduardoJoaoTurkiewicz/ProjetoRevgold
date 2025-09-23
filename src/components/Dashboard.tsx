import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { safeCurrency, safeNumber } from '../utils/numberUtils';

export function Dashboard() {
  const { 
    sales, 
    debts, 
    employees, 
    cashBalances,
    checks,
    boletos,
    employeeCommissions,
    agendaEvents
  } = useAppContext();

  // Calculate summary statistics
  const totalSales = sales.reduce((sum, sale) => sum + safeNumber(sale.totalValue, 0), 0);
  const pendingSales = sales.filter(sale => sale.status === 'pendente').length;
  const totalDebts = debts.reduce((sum, debt) => sum + safeNumber(debt.totalValue, 0), 0);
  const pendingDebts = debts.filter(debt => !debt.isPaid).length;
  const activeEmployees = employees.filter(emp => emp.isActive).length;
  const currentBalance = cashBalances[0]?.currentBalance || 0;
  const pendingChecks = checks.filter(check => check.status === 'pendente').length;
  const pendingBoletos = boletos.filter(boleto => boleto.status === 'pendente').length;
  const pendingCommissions = employeeCommissions.filter(comm => comm.status === 'pendente').length;
  const todayEvents = agendaEvents.filter(event => {
    if (!event || !event.date) return false;
    const eventDate = new Date(event.date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString() && event.status === 'pendente';
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 text-lg">Visão geral do seu negócio</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-900">Saldo Atual</h3>
              <p className="text-2xl font-bold text-green-700">
                {safeCurrency(currentBalance)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Vendas Totais</h3>
              <p className="text-2xl font-bold text-blue-700">
                {safeCurrency(totalSales)}
              </p>
              <p className="text-sm text-blue-600">{pendingSales} pendentes</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-900">Dívidas Totais</h3>
              <p className="text-2xl font-bold text-red-700">
                {safeCurrency(totalDebts)}
              </p>
              <p className="text-sm text-red-600">{pendingDebts} pendentes</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-900">Funcionários</h3>
              <p className="text-2xl font-bold text-purple-700">{activeEmployees}</p>
              <p className="text-sm text-purple-600">ativos</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-orange-50 border-orange-200">
          <h4 className="font-medium text-orange-900 mb-2">Cheques Pendentes</h4>
          <p className="text-xl font-bold text-orange-700">{pendingChecks}</p>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <h4 className="font-medium text-yellow-900 mb-2">Boletos Pendentes</h4>
          <p className="text-xl font-bold text-yellow-700">{pendingBoletos}</p>
        </div>

        <div className="card bg-indigo-50 border-indigo-200">
          <h4 className="font-medium text-indigo-900 mb-2">Comissões Pendentes</h4>
          <p className="text-xl font-bold text-indigo-700">{pendingCommissions}</p>
        </div>

        <div className="card bg-teal-50 border-teal-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            <div>
              <h4 className="font-medium text-teal-900">Eventos Hoje</h4>
              <p className="text-xl font-bold text-teal-700">{todayEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Atividade Recente</h3>
        <div className="space-y-3">
          {sales.slice(0, 5).map(sale => (
            <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{sale.client}</p>
                <p className="text-sm text-slate-600">
                  {new Date(sale.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{safeCurrency(sale.totalValue)}</p>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  sale.status === 'pago' ? 'bg-green-100 text-green-700' :
                  sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {sale.status}
                </span>
              </div>
            </div>
          ))}
          {sales.length === 0 && (
            <p className="text-center text-slate-500 py-8">Nenhuma venda registrada ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}