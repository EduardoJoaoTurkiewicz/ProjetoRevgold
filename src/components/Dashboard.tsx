import React, { useMemo, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  BarChart3, 
  Users, 
  Calendar,
  Receipt,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Zap,
  Target,
  TrendingDown,
  Activity,
  PieChart,
  Filter
import { Canvas, useFrame } from '@react-three/fiber';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export default function Dashboard() {
  const { state } = useApp();
  const [periodFilter, setPeriodFilter] = React.useState('30'); // 30 days default
  const [showPeriodFilter, setShowPeriodFilter] = React.useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Calcular métricas do dia atual
  const todayMetrics = useMemo(() => {
    // Vendas de hoje
    const todaySales = state.sales.filter(sale => sale.date === today);
    const salesToday = todaySales.reduce((sum, sale) => sum + sale.totalValue, 0);
    
    // Valor recebido hoje (vendas pagas hoje)
    const receivedToday = todaySales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    
    // Dívidas criadas hoje
    const todayDebts = state.debts.filter(debt => debt.date === today);
    const debtsToday = todayDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
    
    // Valor pago hoje (dívidas pagas hoje)
    const paidToday = todayDebts.filter(debt => debt.isPaid).reduce((sum, debt) => sum + debt.paidAmount, 0);
    
    return {
      salesToday,
      receivedToday,
      debtsToday,
      paidToday
    };
  }, [state.sales, state.debts, today]);

  // Dados para gráficos avançados
  const chartData = useMemo(() => {
    // Filtrar dados baseado no período selecionado
    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - parseInt(periodFilter));
    const filterDateStr = filterDate.toISOString().split('T')[0];
    
    const filteredSales = state.sales.filter(sale => sale.date >= filterDateStr);
    const filteredDebts = state.debts.filter(debt => debt.date >= filterDateStr);

    // Vendas por mês (últimos 6 meses)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthSales = filteredSales.filter(sale => sale.date.startsWith(monthKey));
      const monthDebts = filteredDebts.filter(debt => debt.date.startsWith(monthKey));
      
      monthlyData.push({
        month: monthName,
        vendas: monthSales.reduce((sum, sale) => sum + sale.totalValue, 0),
        recebido: monthSales.reduce((sum, sale) => sum + sale.receivedAmount, 0),
        dividas: monthDebts.reduce((sum, debt) => sum + debt.totalValue, 0),
        lucro: monthSales.reduce((sum, sale) => sum + sale.receivedAmount, 0) - monthDebts.reduce((sum, debt) => sum + debt.paidAmount, 0)
      });
    }

    // Dados para o gráfico de vendas e gastos por período
    const periodData = [];
    const days = parseInt(periodFilter);
    const interval = days <= 7 ? 1 : days <= 30 ? Math.ceil(days / 7) : Math.ceil(days / 10);
    
    for (let i = days - 1; i >= 0; i -= interval) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = days <= 7 ? date.toLocaleDateString('pt-BR', { weekday: 'short' }) : 
                   days <= 30 ? `${date.getDate()}/${date.getMonth() + 1}` :
                   date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const dayVendas = filteredSales.filter(sale => sale.date === dateStr).reduce((sum, sale) => sum + sale.totalValue, 0);
      const dayGastos = filteredDebts.filter(debt => debt.date === dateStr).reduce((sum, debt) => sum + debt.totalValue, 0);
      
      periodData.push({ periodo: label, vendas: dayVendas, gastos: dayGastos, lucro: dayVendas - dayGastos });
    }

    // Status das vendas
    const salesStatus = [
      { name: 'Pagas', value: state.sales.filter(s => s.status === 'pago').length, color: '#10b981' },
      { name: 'Parciais', value: state.sales.filter(s => s.status === 'parcial').length, color: '#f59e0b' },
      { name: 'Pendentes', value: state.sales.filter(s => s.status === 'pendente').length, color: '#ef4444' }
    ];

    // Performance por funcionário
    const employeePerformance = state.employees.map(emp => {
      const empSales = state.sales.filter(sale => sale.sellerId === emp.id);
      return {
        name: emp.name.split(' ')[0],
        vendas: empSales.length,
        valor: empSales.reduce((sum, sale) => sum + sale.totalValue, 0)
      };
    }).filter(emp => emp.vendas > 0);

    // Fluxo de caixa diário (últimos 30 dias)
    const cashFlow = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.getDate();
      
      const dayReceived = state.sales.filter(sale => sale.date === dateStr).reduce((sum, sale) => sum + sale.receivedAmount, 0);
      const dayPaid = state.debts.filter(debt => debt.date === dateStr).reduce((sum, debt) => sum + debt.paidAmount, 0);
      
      cashFlow.push({
        day: dayName,
        entrada: dayReceived,
        saida: dayPaid,
        saldo: dayReceived - dayPaid
      });
    }

    return {
      monthlyData,
      periodData,
      filteredSales,
      salesStatus,
      employeePerformance,
      cashFlow
    };
  }, [state.sales, state.debts, state.employees]);

  // Alertas e notificações
  const alerts = useMemo(() => {
    const dueToday = state.checks.filter(check => check.dueDate === today);
    const overdueChecks = state.checks.filter(check => check.dueDate < today && check.status === 'pendente');
    const dueBoletos = state.boletos.filter(boleto => boleto.dueDate === today);
    const overdueBoletos = state.boletos.filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');
    
    return {
      checksToday: dueToday.length,
      overdueChecks: overdueChecks.length,
      boletosToday: dueBoletos.length,
      overdueBoletos: overdueBoletos.length
    };
  }, [state.checks, state.boletos, today]);

  // Estatísticas gerais
  const generalStats = useMemo(() => {
    const totalSales = state.sales.length;
    const totalDebts = state.debts.length;
    const totalChecks = state.checks.length;
    const totalBoletos = state.boletos.length;
    const activeEmployees = state.employees.filter(emp => emp.isActive).length;
    
    return {
      totalSales,
      totalDebts,
      totalChecks,
      totalBoletos,
      activeEmployees
    };
  }, [state]);

  return (
    <div className="space-y-8">
      {/* Header com efeitos */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-green-900/30 to-emerald-900/20 blur-3xl"></div>
        <div className="relative bg-gradient-to-br from-slate-800 via-green-900 to-emerald-900 rounded-3xl p-12 text-white shadow-2xl">
          <div className="absolute top-4 right-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-full blur-xl animate-pulse"></div>
          </div>
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl floating-animation">
              <BarChart3 className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
                Dashboard RevGold
              </h1>
              <p className="text-2xl text-green-200 font-bold">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-green-300" />
                </div>
                <div>
                  <p className="text-green-200 font-semibold">Funcionários Ativos</p>
                  <p className="text-2xl font-black text-white">{generalStats.activeEmployees}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <p className="text-blue-200 font-semibold">Total de Vendas</p>
                  <p className="text-2xl font-black text-white">{generalStats.totalSales}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <p className="text-purple-200 font-semibold">Cheques & Boletos</p>
                  <p className="text-2xl font-black text-white">{generalStats.totalChecks + generalStats.totalBoletos}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6 text-orange-300" />
                </div>
                <div>
                  <p className="text-orange-200 font-semibold">Total de Dívidas</p>
                  <p className="text-2xl font-black text-white">{generalStats.totalDebts}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas do Dia - Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Vendas Hoje */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-3xl p-8 border-2 border-green-300/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 floating-animation">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-green-800 mb-2">Vendas Hoje</h3>
                <p className="text-4xl font-black text-green-700 mb-1">
                  R$ {todayMetrics.salesToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-green-600">Atualizado em tempo real</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Valor Recebido Hoje */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-3xl p-8 border-2 border-blue-300/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 floating-animation" style={{ animationDelay: '0.5s' }}>
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-blue-800 mb-2">Valor Recebido Hoje</h3>
                <p className="text-4xl font-black text-blue-700 mb-1">
                  R$ {todayMetrics.receivedToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-600">Pagamentos confirmados</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dívidas Feitas Hoje */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 rounded-3xl p-8 border-2 border-orange-300/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-700 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 floating-animation" style={{ animationDelay: '1s' }}>
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-orange-800 mb-2">Dívidas Feitas Hoje</h3>
                <p className="text-4xl font-black text-orange-700 mb-1">
                  R$ {todayMetrics.debtsToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-bold text-orange-600">Novos compromissos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Valor Pago Hoje */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 rounded-3xl p-8 border-2 border-purple-300/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-700 rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 floating-animation" style={{ animationDelay: '1.5s' }}>
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-purple-800 mb-2">Valor Pago Hoje</h3>
                <p className="text-4xl font-black text-purple-700 mb-1">
                  R$ {todayMetrics.paidToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-purple-600">Dívidas quitadas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Avançados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendas e Gastos por Período */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-emerald-900/30 to-green-900/20 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-800 via-green-900/70 to-emerald-900/70 rounded-3xl p-8 text-white shadow-2xl border border-green-400/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl floating-animation">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Vendas e Gastos por Período</h2>
                <p className="text-green-200 font-bold">Análise comparativa de receitas e despesas</p>
              </div>
              </div>
              <button
                onClick={() => setShowPeriodFilter(!showPeriodFilter)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 transition-all duration-300 border border-green-400/30"
              >
                <Filter className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {showPeriodFilter && (
              <div className="mb-6 p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-green-400/30">
                <label className="block text-green-200 font-bold mb-3">Período de Análise:</label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white/20 backdrop-blur-sm border border-green-400/30 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="7" className="text-slate-900">Últimos 7 dias</option>
                  <option value="15" className="text-slate-900">Últimos 15 dias</option>
                  <option value="30" className="text-slate-900">Últimos 30 dias</option>
                  <option value="60" className="text-slate-900">Últimos 60 dias</option>
                  <option value="90" className="text-slate-900">Últimos 90 dias</option>
                </select>
              </div>
            )}
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.periodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="periodo" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip 
                  formatter={(value, name) => [
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    name === 'vendas' ? 'Vendas' : name === 'gastos' ? 'Gastos' : 'Lucro'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar dataKey="vendas" fill="#10b981" name="Vendas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" fill="#3b82f6" name="Lucro" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-green-400/20">
                <p className="text-green-200 text-sm font-bold">Total Vendas</p>
                <p className="text-xl font-black text-white">
                  R$ {chartData.periodData.reduce((sum, item) => sum + item.vendas, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-red-400/20">
                <p className="text-red-200 text-sm font-bold">Total Gastos</p>
                <p className="text-xl font-black text-white">
                  R$ {chartData.periodData.reduce((sum, item) => sum + item.gastos, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-blue-400/20">
                <p className="text-blue-200 text-sm font-bold">Lucro Líquido</p>
                <p className={`text-xl font-black ${chartData.periodData.reduce((sum, item) => sum + item.lucro, 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  R$ {chartData.periodData.reduce((sum, item) => sum + item.lucro, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Clientes do Período */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-violet-900/30 to-purple-900/20 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-800 via-purple-900/70 to-violet-900/70 rounded-3xl p-8 text-white shadow-2xl border border-purple-400/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl floating-animation">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Top Clientes do Período</h2>
                <p className="text-purple-200 font-bold">Maiores compradores dos últimos {periodFilter} dias</p>
              </div>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(() => {
                const clientsInPeriod = {};
                chartData.filteredSales.forEach(sale => {
                  if (!clientsInPeriod[sale.client]) {
                    clientsInPeriod[sale.client] = { name: sale.client, total: 0, count: 0 };
                  }
                  clientsInPeriod[sale.client].total += sale.totalValue;
                  clientsInPeriod[sale.client].count += 1;
                });
                
                return Object.values(clientsInPeriod)
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 8)
                  .map((client, index) => (
                    <div key={client.name} className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-purple-400/20 hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-white">{client.name}</p>
                          <p className="text-purple-200 text-sm">{client.count} compra(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white">
                          R$ {client.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-purple-200 text-sm">
                          Média: R$ {(client.total / client.count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ));
              })()}
              
              {chartData.filteredSales.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 mx-auto mb-4 text-purple-300 opacity-50" />
                  <p className="text-purple-200">Nenhuma venda no período selecionado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Avançados 2D */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fluxo de Caixa */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Fluxo de Caixa (30 dias)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.cashFlow}>
              <defs>
                <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Area type="monotone" dataKey="entrada" stackId="1" stroke="#10b981" fill="url(#colorEntrada)" name="Entradas" />
              <Area type="monotone" dataKey="saida" stackId="2" stroke="#ef4444" fill="url(#colorSaida)" name="Saídas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status das Vendas - Gráfico de Pizza */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 modern-shadow-lg">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Status das Vendas</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartData.salesStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.salesStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance dos Funcionários */}
      {chartData.employeePerformance.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 modern-shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Performance dos Vendedores</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.employeePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'valor' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value,
                  name === 'valor' ? 'Valor Total' : 'Número de Vendas'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="vendas" fill="#3b82f6" name="Vendas" />
              <Bar yAxisId="right" dataKey="valor" fill="#10b981" name="Valor (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Evolução Mensal */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 modern-shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Evolução Mensal Completa</h3>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            <Legend />
            <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={3} name="Vendas" dot={{ r: 6 }} />
            <Line type="monotone" dataKey="recebido" stroke="#3b82f6" strokeWidth={3} name="Recebido" dot={{ r: 6 }} />
            <Line type="monotone" dataKey="dividas" stroke="#ef4444" strokeWidth={3} name="Dívidas" dot={{ r: 6 }} />
            <Line type="monotone" dataKey="lucro" stroke="#8b5cf6" strokeWidth={3} name="Lucro" dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alertas e Notificações */}
      {(alerts.checksToday > 0 || alerts.overdueChecks > 0 || alerts.boletosToday > 0 || alerts.overdueBoletos > 0) && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-orange-900/30 to-yellow-900/20 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-800 via-red-900/50 to-orange-900/50 rounded-3xl p-8 text-white shadow-2xl border border-red-400/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
                <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Alertas Importantes</h2>
                <p className="text-red-200 font-semibold">Itens que precisam de sua atenção</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {alerts.checksToday > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-6 h-6 text-blue-300" />
                    <span className="font-bold text-blue-200">Cheques Hoje</span>
                  </div>
                  <p className="text-2xl font-black text-white">{alerts.checksToday}</p>
                  <p className="text-sm text-blue-200">Vencimento hoje</p>
                </div>
              )}
              
              {alerts.overdueChecks > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-red-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-6 h-6 text-red-300" />
                    <span className="font-bold text-red-200">Cheques Vencidos</span>
                  </div>
                  <p className="text-2xl font-black text-white">{alerts.overdueChecks}</p>
                  <p className="text-sm text-red-200">Precisam atenção</p>
                </div>
              )}
              
              {alerts.boletosToday > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6 text-green-300" />
                    <span className="font-bold text-green-200">Boletos Hoje</span>
                  </div>
                  <p className="text-2xl font-black text-white">{alerts.boletosToday}</p>
                  <p className="text-sm text-green-200">Vencimento hoje</p>
                </div>
              )}
              
              {alerts.overdueBoletos > 0 && (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-6 h-6 text-orange-300" />
                    <span className="font-bold text-orange-200">Boletos Vencidos</span>
                  </div>
                  <p className="text-2xl font-black text-white">{alerts.overdueBoletos}</p>
                  <p className="text-sm text-orange-200">Precisam atenção</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resumo Rápido */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-emerald-900/30 to-green-900/20 blur-3xl"></div>
        <div className="relative bg-gradient-to-br from-slate-800 via-green-900/70 to-emerald-900/70 rounded-3xl p-8 text-white shadow-2xl border border-green-400/30">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl floating-animation">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2">Sistema RevGold</h2>
              <p className="text-green-200 font-bold text-lg">Gestão Empresarial Profissional</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-2xl text-green-200 font-bold mb-4">
              "Colorindo seu ambiente e levando vida para os seus dias"
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 font-bold">Sistema Online e Funcionando</span>
              <Sparkles className="w-5 h-5 text-green-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}