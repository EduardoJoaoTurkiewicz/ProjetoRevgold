import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Receipt,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Dashboard: React.FC = () => {
  const { state } = useApp();

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalSales = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalReceived = state.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    const totalPending = state.sales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
    const totalDebts = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalDebtsPaid = state.debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    
    const netProfit = totalReceived - totalDebtsPaid;
    const profitMargin = totalReceived > 0 ? (netProfit / totalReceived) * 100 : 0;

    // Today's data
    const today = new Date().toISOString().split('T')[0];
    const todaySales = state.sales.filter(sale => sale.date === today);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalValue, 0);

    // Overdue items
    const overdueChecks = state.checks.filter(check => 
      check.dueDate < today && check.status === 'pendente'
    );
    const overdueBoletos = state.boletos.filter(boleto => 
      boleto.dueDate < today && boleto.status === 'pendente'
    );

    // Due today
    const dueTodayChecks = state.checks.filter(check => check.dueDate === today);
    const dueTodayBoletos = state.boletos.filter(boleto => boleto.dueDate === today);

    return {
      totalSales,
      totalReceived,
      totalPending,
      totalDebts,
      totalDebtsPaid,
      netProfit,
      profitMargin,
      salesCount: state.sales.length,
      debtsCount: state.debts.length,
      checksCount: state.checks.length,
      boletosCount: state.boletos.length,
      employeesCount: state.employees.filter(emp => emp.isActive).length,
      todayRevenue,
      todaySalesCount: todaySales.length,
      overdueCount: overdueChecks.length + overdueBoletos.length,
      dueTodayCount: dueTodayChecks.length + dueTodayBoletos.length
    };
  }, [state]);

  // Sales by month data
  const salesByMonth = useMemo(() => {
    const monthlyData = {};
    state.sales.forEach(sale => {
      const month = new Date(sale.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, vendas: 0, recebido: 0 };
      }
      monthlyData[month].vendas += sale.totalValue;
      monthlyData[month].recebido += sale.receivedAmount;
    });
    return Object.values(monthlyData).slice(-6); // Last 6 months
  }, [state.sales]);

  // Payment methods distribution
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

  // Recent activities
  const recentActivities = useMemo(() => {
    const activities = [];
    
    // Recent sales
    state.sales.slice(-5).forEach(sale => {
      activities.push({
        id: sale.id,
        type: 'sale',
        title: `Venda para ${sale.client}`,
        amount: sale.totalValue,
        date: sale.date,
        status: sale.status
      });
    });

    // Recent debts
    state.debts.slice(-3).forEach(debt => {
      activities.push({
        id: debt.id,
        type: 'debt',
        title: `Dívida - ${debt.company}`,
        amount: debt.totalValue,
        date: debt.date,
        status: debt.isPaid ? 'pago' : 'pendente'
      });
    });

    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  }, [state.sales, state.debts]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            Olá, {state.user?.username}! 👋
          </h1>
          <p className="text-xl text-slate-600 font-medium">
            Aqui está o resumo do seu negócio hoje
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 font-medium">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long',
              year: 'numeric'
            })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-bold text-sm">Sistema Online</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-green-600 modern-shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Vendas Totais</h3>
              <p className="text-3xl font-black text-green-700">
                R$ {metrics.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600 font-semibold">{metrics.salesCount} vendas</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-600 modern-shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Recebido</h3>
              <p className="text-3xl font-black text-blue-700">
                R$ {metrics.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                {((metrics.totalReceived / metrics.totalSales) * 100 || 0).toFixed(1)}% do total
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 modern-shadow-xl group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-orange-600 modern-shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">A Receber</h3>
              <p className="text-3xl font-black text-orange-700">
                R$ {metrics.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-orange-600 font-semibold">Pendente</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 modern-shadow-xl group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-purple-600 modern-shadow-lg group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 text-lg">Lucro Líquido</h3>
              <p className={`text-3xl font-black ${metrics.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                R$ {metrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-purple-600 font-semibold">
                {metrics.profitMargin.toFixed(1)}% margem
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Summary & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Hoje</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
              <span className="font-semibold text-green-800">Vendas</span>
              <div className="text-right">
                <p className="font-bold text-green-700">{metrics.todaySalesCount}</p>
                <p className="text-sm text-green-600">
                  R$ {metrics.todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <span className="font-semibold text-blue-800">Vencimentos</span>
              <div className="text-right">
                <p className="font-bold text-blue-700">{metrics.dueTodayCount}</p>
                <p className="text-sm text-blue-600">itens</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-red-600 modern-shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Alertas</h3>
          </div>
          <div className="space-y-4">
            {metrics.overdueCount > 0 && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-bold text-red-800">{metrics.overdueCount} itens vencidos</p>
                    <p className="text-sm text-red-600">Cheques e boletos em atraso</p>
                  </div>
                </div>
              </div>
            )}
            {metrics.dueTodayCount > 0 && (
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-bold text-yellow-800">{metrics.dueTodayCount} vencem hoje</p>
                    <p className="text-sm text-yellow-600">Acompanhe os recebimentos</p>
                  </div>
                </div>
              </div>
            )}
            {metrics.overdueCount === 0 && metrics.dueTodayCount === 0 && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-bold text-green-800">Tudo em dia!</p>
                    <p className="text-sm text-green-600">Nenhum item vencido</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-indigo-600 modern-shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Resumo Geral</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Funcionários</span>
              <span className="font-bold text-slate-900">{metrics.employeesCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Cheques</span>
              <span className="font-bold text-slate-900">{metrics.checksCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Boletos</span>
              <span className="font-bold text-slate-900">{metrics.boletosCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Dívidas</span>
              <span className="font-bold text-slate-900">{metrics.debtsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Evolução das Vendas</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={3} name="Vendas" />
              <Line type="monotone" dataKey="recebido" stroke="#3b82f6" strokeWidth={3} name="Recebido" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
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

      {/* Recent Activities */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-purple-600 modern-shadow-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Atividades Recentes</h3>
        </div>
        
        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'sale' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {activity.type === 'sale' ? 
                      <ShoppingCart className="w-5 h-5" /> : 
                      <CreditCard className="w-5 h-5" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{activity.title}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(activity.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    R$ {activity.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activity.status === 'pago' ? 'bg-green-100 text-green-700' :
                    activity.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {activity.status === 'pago' ? 'Pago' :
                     activity.status === 'parcial' ? 'Parcial' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">Nenhuma atividade recente</p>
            <p className="text-slate-400 text-sm">Comece registrando vendas e dívidas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;