import React, { useMemo } from 'react';
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
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { state } = useApp();
  
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