import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, AlertTriangle, CheckCircle, Clock, CreditCard, Receipt, FileText, Star, Wallet, ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const { state } = useApp();

  // Calcular métricas principais
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    // Vendas do dia
    const salesToday = state.sales.filter(sale => sale.date === today);
    const totalSalesToday = salesToday.reduce((sum, sale) => sum + sale.totalValue, 0);
    
    // Valor recebido hoje (incluindo cheques e boletos compensados hoje)
    let totalReceivedToday = 0;
    
    // Vendas com pagamento instantâneo hoje
    salesToday.forEach(sale => {
      sale.paymentMethods.forEach(method => {
        if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type)) {
          totalReceivedToday += method.amount;
        }
        if (method.type === 'cartao_credito' && (!method.installments || method.installments === 1)) {
          totalReceivedToday += method.amount;
        }
      });
    });
    
    // Cheques compensados hoje
    state.checks.forEach(check => {
      if (check.dueDate === today && check.status === 'compensado') {
        totalReceivedToday += check.value;
      }
    });
    
    // Boletos pagos hoje
    state.boletos.forEach(boleto => {
      if (boleto.dueDate === today && boleto.status === 'compensado') {
        totalReceivedToday += boleto.value;
      }
    });
    
    // Dívidas do dia
    const debtsToday = state.debts.filter(debt => debt.date === today);
    const totalDebtsToday = debtsToday.reduce((sum, debt) => sum + debt.totalValue, 0);
    
    // Valor pago hoje
    let totalPaidToday = 0;
    
    // Dívidas pagas hoje
    debtsToday.forEach(debt => {
      debt.paymentMethods.forEach(method => {
        if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
          totalPaidToday += method.amount;
        }
      });
    });
    
    // Vendas totais e recebimentos totais
    const totalSales = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalReceived = state.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    const totalPending = state.sales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
    const salesThisMonth = state.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
    });
    const monthlyRevenue = salesThisMonth.reduce((sum, sale) => sum + sale.totalValue, 0);
    const monthlyReceived = salesThisMonth.reduce((sum, sale) => sum + sale.receivedAmount, 0);

    // Dívidas
    const totalDebts = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalPaidDebts = state.debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    const totalPendingDebts = state.debts.reduce((sum, debt) => sum + debt.pendingAmount, 0);
    
    // Dívidas do mês
    const debtsThisMonth = state.debts.filter(debt => {
      const debtDate = new Date(debt.date);
      return debtDate.getMonth() === thisMonth && debtDate.getFullYear() === thisYear;
    });
    const monthlyDebts = debtsThisMonth.reduce((sum, debt) => sum + debt.totalValue, 0);
    const monthlyPaidDebts = debtsThisMonth.reduce((sum, debt) => sum + debt.paidAmount, 0);

    // Cheques
    const checksToday = state.checks.filter(check => check.dueDate === today);
    const overdueChecks = state.checks.filter(check => check.dueDate < today && check.status === 'pendente');
    const totalChecksValue = state.checks.reduce((sum, check) => sum + check.value, 0);

    // Boletos
    const boletosToday = state.boletos.filter(boleto => boleto.dueDate === today);
    const overdueBoletos = state.boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');
    const totalBoletosValue = state.boletos.reduce((sum, boleto) => sum + boleto.value, 0);

    // Funcionários
    const activeEmployees = state.employees.filter(emp => emp.isActive);
    const sellers = activeEmployees.filter(emp => emp.isSeller);
    const totalPayroll = activeEmployees.reduce((sum, emp) => sum + emp.salary, 0);

    // Comissões
    const pendingCommissions = state.employeeCommissions.filter(comm => comm.status === 'pendente');
    const totalPendingCommissions = pendingCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
    const monthlyCommissions = state.employeeCommissions.filter(comm => {
      const commDate = new Date(comm.date);
      return commDate.getMonth() === thisMonth && commDate.getFullYear() === thisYear;
    });

    // Caixa
    const cashBalance = state.cashBalance?.currentBalance || 0;

    // Lucro líquido do mês
    const monthlyNetProfit = monthlyReceived - monthlyPaidDebts;
    const monthlyProfitMargin = monthlyReceived > 0 ? (monthlyNetProfit / monthlyReceived) * 100 : 0;

    return {
      totalSalesToday,
      totalReceivedToday,
      totalDebtsToday,
      totalPaidToday,
      totalSales,
      totalReceived,
      totalPending,
      monthlyRevenue,
      monthlyReceived,
      monthlyDebts,
      monthlyPaidDebts,
      monthlyNetProfit,
      monthlyProfitMargin,
      totalDebts,
      totalPaidDebts,
      totalPendingDebts,
      checksToday: checksToday.length,
      overdueChecks: overdueChecks.length,
      totalChecksValue,
      boletosToday: boletosToday.length,
      overdueBoletos: overdueBoletos.length,
      totalBoletosValue,
      activeEmployees: activeEmployees.length,
      sellers: sellers.length,
      totalPayroll,
      pendingCommissions: pendingCommissions.length,
      totalPendingCommissions,
      monthlyCommissions: monthlyCommissions.length,
      cashBalance,
      netProfit: monthlyNetProfit,
      profitMargin: monthlyProfitMargin
    };
  }, [state]);

  // Dados para gráficos - últimos 30 dias
  const chartData = useMemo(() => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailySales = state.sales.filter(sale => sale.date === dateStr);
      const dailyDebts = state.debts.filter(debt => debt.date === dateStr);
      
      const salesValue = dailySales.reduce((sum, sale) => sum + sale.totalValue, 0);
      const debtsValue = dailyDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
      const profit = salesValue - debtsValue;
      
      last30Days.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        vendas: salesValue,
        dividas: debtsValue,
        lucro: profit
      });
    }
    
    return last30Days;
  }, [state.sales, state.debts]);

  // Distribuição de métodos de pagamento
  const paymentMethodsData = useMemo(() => {
    const methods = {};
    state.sales.forEach(sale => {
      sale.paymentMethods.forEach(method => {
        const methodName = method.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (!methods[methodName]) {
          methods[methodName] = 0;
        }
        methods[methodName] += method.amount;
      });
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [state.sales]);

  // Top vendedores
  const topSellers = useMemo(() => {
    const sellerStats = {};
    
    state.sales.forEach(sale => {
      if (sale.sellerId) {
        const seller = state.employees.find(e => e.id === sale.sellerId);
        if (seller) {
          if (!sellerStats[seller.id]) {
            sellerStats[seller.id] = {
              name: seller.name,
              totalSales: 0,
              totalValue: 0,
              commissions: 0
            };
          }
          sellerStats[seller.id].totalSales += 1;
          sellerStats[seller.id].totalValue += sale.totalValue;
        }
      }
    });
    
    // Adicionar comissões
    state.employeeCommissions.forEach(comm => {
      const seller = state.employees.find(e => e.id === comm.employeeId);
      if (seller && sellerStats[seller.id]) {
        sellerStats[seller.id].commissions += comm.commissionAmount;
      }
    });
    
    return Object.values(sellerStats)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }, [state.sales, state.employees, state.employeeCommissions]);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 font-semibold">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-xl">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Financeiro</h1>
          <p className="text-slate-600 text-lg">Visão geral completa do seu negócio</p>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Aviso do Sistema</h3>
              <p className="text-red-700">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Vendas */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900">Total de Vendas</h3>
              <p className="text-2xl font-black text-green-700">
                R$ {metrics.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600">{state.sales.length} vendas</p>
            </div>
          </div>
        </div>

        {/* Recebido */}
        <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-600">
              <ArrowUpCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900">Valor Recebido</h3>
              <p className="text-2xl font-black text-emerald-700">
                R$ {metrics.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-emerald-600">Efetivamente recebido</p>
            </div>
          </div>
        </div>

        {/* Dívidas */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-600">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-900">Total de Dívidas</h3>
              <p className="text-2xl font-black text-red-700">
                R$ {metrics.totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-red-600">{state.debts.length} dívidas</p>
            </div>
          </div>
        </div>

        {/* Saldo em Caixa */}
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Saldo em Caixa</h3>
              <p className="text-2xl font-black text-blue-700">
                R$ {metrics.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-blue-600">Disponível agora</p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Lucro Líquido */}
        <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-600">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900">Lucro Líquido</h3>
              <p className={`text-2xl font-black ${metrics.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                R$ {metrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-purple-600">{metrics.profitMargin.toFixed(1)}% margem</p>
            </div>
          </div>
        </div>

        {/* Funcionários */}
        <div className="card bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-600">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-900">Funcionários</h3>
              <p className="text-2xl font-black text-indigo-700">{metrics.activeEmployees}</p>
              <p className="text-sm text-indigo-600">{metrics.sellers} vendedores</p>
            </div>
          </div>
        </div>

        {/* Comissões Pendentes */}
        <div className="card bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-600">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-yellow-900">Comissões</h3>
              <p className="text-2xl font-black text-yellow-700">
                R$ {metrics.totalPendingCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-yellow-600">{metrics.pendingCommissions} pendentes</p>
            </div>
          </div>
        </div>

        {/* Folha de Pagamento */}
        <div className="card bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-600">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-cyan-900">Folha de Pagamento</h3>
              <p className="text-2xl font-black text-cyan-700">
                R$ {metrics.totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-cyan-600">Salários base</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas e Vencimentos */}
      {(metrics.checksToday > 0 || metrics.overdueChecks > 0 || metrics.boletosToday > 0 || metrics.overdueBoletos > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cheques */}
          {(metrics.checksToday > 0 || metrics.overdueChecks > 0) && (
            <div className="card bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 modern-shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-yellow-600">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-yellow-900">Cheques</h3>
              </div>
              
              <div className="space-y-3">
                {metrics.checksToday > 0 && (
                  <div className="p-4 bg-blue-100 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-bold text-blue-900">Vencimentos Hoje</p>
                        <p className="text-sm text-blue-700">{metrics.checksToday} cheque(s)</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {metrics.overdueChecks > 0 && (
                  <div className="p-4 bg-red-100 rounded-xl border border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-bold text-red-900">Cheques Vencidos</p>
                        <p className="text-sm text-red-700">{metrics.overdueChecks} cheque(s)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Boletos */}
          {(metrics.boletosToday > 0 || metrics.overdueBoletos > 0) && (
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-600">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">Boletos</h3>
              </div>
              
              <div className="space-y-3">
                {metrics.boletosToday > 0 && (
                  <div className="p-4 bg-green-100 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-bold text-green-900">Vencimentos Hoje</p>
                        <p className="text-sm text-green-700">{metrics.boletosToday} boleto(s)</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {metrics.overdueBoletos > 0 && (
                  <div className="p-4 bg-red-100 rounded-xl border border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-bold text-red-900">Boletos Vencidos</p>
                        <p className="text-sm text-red-700">{metrics.overdueBoletos} boleto(s)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fluxo Financeiro - Últimos 30 Dias */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-blue-600">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Fluxo Financeiro (30 dias)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Area type="monotone" dataKey="vendas" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Vendas" />
              <Area type="monotone" dataKey="dividas" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Dívidas" />
              <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={3} name="Lucro" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Métodos de Pagamento */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-purple-600">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Métodos de Pagamento</h3>
          </div>
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
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Vendedores */}
      {topSellers.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Top Vendedores</h3>
          </div>
          
          <div className="space-y-4">
            {topSellers.map((seller, index) => (
              <div key={seller.name} className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900">{seller.name}</h4>
                      <p className="text-sm text-green-700">{seller.totalSales} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-green-600">
                      R$ {seller.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-green-600 font-bold">
                      Comissão: R$ {seller.commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumo de Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vendas por Status */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Status das Vendas</h3>
          </div>
          
          <div className="space-y-3">
            {['pago', 'parcial', 'pendente'].map(status => {
              const count = state.sales.filter(sale => sale.status === status).length;
              const value = state.sales.filter(sale => sale.status === status).reduce((sum, sale) => sum + sale.totalValue, 0);
              
              return (
                <div key={status} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="font-medium capitalize text-slate-900">{status}</span>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{count} vendas</p>
                    <p className="text-sm text-slate-600">
                      R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dívidas por Status */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-red-600">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Status das Dívidas</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
              <span className="font-medium text-slate-900">Pagas</span>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  {state.debts.filter(debt => debt.isPaid).length} dívidas
                </p>
                <p className="text-sm text-slate-600">
                  R$ {metrics.totalPaidDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
              <span className="font-medium text-slate-900">Pendentes</span>
              <div className="text-right">
                <p className="font-bold text-red-600">
                  {state.debts.filter(debt => !debt.isPaid).length} dívidas
                </p>
                <p className="text-sm text-slate-600">
                  R$ {metrics.totalPendingDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recebimentos */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-emerald-600">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Recebimentos</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
              <span className="font-medium text-slate-900">Já Recebido</span>
              <div className="text-right">
                <p className="font-bold text-emerald-600">
                  R$ {metrics.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
              <span className="font-medium text-slate-900">A Receber</span>
              <div className="text-right">
                <p className="font-bold text-orange-600">
                  R$ {metrics.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
              <span className="font-medium text-slate-900">Cheques</span>
              <div className="text-right">
                <p className="font-bold text-blue-600">
                  R$ {metrics.totalChecksValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">{state.checks.length} cheques</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-xl">
              <span className="font-medium text-slate-900">Boletos</span>
              <div className="text-right">
                <p className="font-bold text-cyan-600">
                  R$ {metrics.totalBoletosValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">{state.boletos.length} boletos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Mensal */}
      <div className="card bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 modern-shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Resumo do Mês Atual</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-green-600 font-semibold">Faturamento</p>
              <p className="text-3xl font-black text-green-700">
                R$ {metrics.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-green-600 font-semibold">Vendas</p>
              <p className="text-3xl font-black text-green-700">
                {state.sales.filter(sale => {
                  const saleDate = new Date(sale.date);
                  return saleDate.getMonth() === new Date().getMonth() && saleDate.getFullYear() === new Date().getFullYear();
                }).length}
              </p>
            </div>
            <div>
              <p className="text-green-600 font-semibold">Comissões</p>
              <p className="text-3xl font-black text-green-700">
                {metrics.monthlyCommissions}
              </p>
            </div>
            <div>
              <p className="text-green-600 font-semibold">Lucro</p>
              <p className={`text-3xl font-black ${metrics.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                R$ {metrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info - Mostrar apenas se houver problemas */}
      {state.sales.length === 0 && state.debts.length === 0 && (
        <div className="card bg-yellow-50 border-yellow-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <h3 className="text-xl font-bold text-yellow-900">Informações do Sistema</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <p><strong>Supabase Configurado:</strong> {isSupabaseConfigured() ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Vendas Carregadas:</strong> {state.sales.length}</p>
            <p><strong>Dívidas Carregadas:</strong> {state.debts.length}</p>
            <p><strong>Funcionários Carregados:</strong> {state.employees.length}</p>
            <p><strong>Cheques Carregados:</strong> {state.checks.length}</p>
            <p><strong>Boletos Carregados:</strong> {state.boletos.length}</p>
            <p><strong>Comissões Carregadas:</strong> {state.employeeCommissions.length}</p>
            <p><strong>Estado de Loading:</strong> {state.isLoading ? 'Carregando...' : 'Concluído'}</p>
            {state.error && <p><strong>Erro:</strong> {state.error}</p>}
          </div>
          
          <div className="mt-6">
            <button
              onClick={loadAllData}
              className="btn-primary"
            >
              Recarregar Dados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}