import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, AlertTriangle, CheckCircle, Clock, CreditCard, Receipt, FileText, Star, Wallet, ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const { 
    loading, 
    error, 
    sales, 
    debts, 
    employees, 
    checks, 
    boletos, 
    employeeCommissions, 
    cashBalance, 
    loadAllData, 
    isSupabaseConfigured: checkSupabase 
  } = useApp();
  
  // Define today at component level so it's accessible throughout
  const today = new Date().toISOString().split('T')[0];
  
  console.log('📊 Dashboard renderizado, estado:', {
    isLoading: loading,
    error: error,
    salesCount: sales.length,
    debtsCount: debts.length,
    employeesCount: employees.length
  });

  // Carregar dados se necessário
  React.useEffect(() => {
    // Sempre tentar carregar dados quando o dashboard for montado
    if (!loading) {
      console.log('🔄 Dashboard carregando dados...');
      loadAllData();
    }
  }, [loadAllData]);
  // Calcular métricas principais
  const metrics = useMemo(() => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    // Vendas do dia
    const salesToday = (sales || []).filter(sale => sale.date === today);
    const totalSalesToday = salesToday.reduce((sum, sale) => sum + sale.totalValue, 0);
    
    // Valor recebido hoje (incluindo cheques e boletos compensados hoje)
    let totalReceivedToday = 0;
    
    // Vendas com pagamento instantâneo hoje
    salesToday.forEach(sale => {
      (sale.paymentMethods || []).forEach(method => {
        if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
            (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
          totalReceivedToday += method.amount;
        }
      });
    });
    
    // Cheques compensados hoje
    (checks || []).forEach(check => {
      if (check.dueDate === today && check.status === 'compensado') {
        totalReceivedToday += check.value;
      }
    });
    
    // Boletos pagos hoje
    (boletos || []).forEach(boleto => {
      if (boleto.dueDate === today && boleto.status === 'compensado') {
        // Usar valor final menos custos de cartório
        const finalAmount = boleto.finalAmount || boleto.value;
        const notaryCosts = boleto.notaryCosts || 0;
        const netReceived = finalAmount - notaryCosts;
        totalReceivedToday += netReceived;
      }
    });
    
    // Dívidas do dia
    const debtsToday = (debts || []).filter(debt => debt.date === today);
    const totalDebtsToday = debtsToday.reduce((sum, debt) => sum + debt.totalValue, 0);
    
    // Valor pago hoje
    let totalPaidToday = 0;
    
    // Dívidas pagas hoje
    debtsToday.forEach(debt => {
      if (debt.isPaid) {
        (debt.paymentMethods || []).forEach(method => {
          if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
            totalPaidToday += method.amount;
          }
        });
      }
    });
    
    // Adicionar cheques próprios pagos hoje
    (checks || []).forEach(check => {
      if (check.isOwnCheck && check.dueDate === today && check.status === 'compensado') {
        totalPaidToday += check.value;
      }
    });
    
    // Adicionar boletos da empresa pagos hoje
    (debts || []).forEach(debt => {
      if (debt.date === today && debt.isPaid) {
        (debt.paymentMethods || []).forEach(method => {
          if (method.type === 'boleto') {
            totalPaidToday += method.amount;
          }
        });
      }
    });
    
    // Vendas totais e recebimentos totais
    const totalSales = (sales || []).reduce((sum, sale) => sum + sale.totalValue, 0);
    let totalReceived = (sales || []).reduce((sum, sale) => sum + sale.receivedAmount, 0);
    
    // Adicionar boletos compensados ao valor recebido
    (boletos || []).forEach(boleto => {
      if (boleto.status === 'compensado') {
        const finalAmount = boleto.finalAmount || boleto.value;
        const notaryCosts = boleto.notaryCosts || 0;
        const netReceived = finalAmount - notaryCosts;
        totalReceived += netReceived;
      }
    });
    
    const totalPending = (sales || []).reduce((sum, sale) => sum + sale.pendingAmount, 0);
    const salesThisMonth = (sales || []).filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
    });
    const monthlyRevenue = salesThisMonth.reduce((sum, sale) => sum + sale.totalValue, 0);
    let monthlyReceived = salesThisMonth.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    
    // Adicionar boletos compensados do mês ao valor recebido
    const monthlyBoletos = (boletos || []).filter(boleto => {
      const boletoDate = new Date(boleto.dueDate);
      return boletoDate.getMonth() === thisMonth && 
             boletoDate.getFullYear() === thisYear && 
             boleto.status === 'compensado';
    });
    
    monthlyBoletos.forEach(boleto => {
      const finalAmount = boleto.finalAmount || boleto.value;
      const notaryCosts = boleto.notaryCosts || 0;
      const netReceived = finalAmount - notaryCosts;
      monthlyReceived += netReceived;
    });

    // Dívidas
    const totalDebts = (debts || []).reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalPaidDebts = (debts || []).reduce((sum, debt) => sum + debt.paidAmount, 0);
    const totalPendingDebts = (debts || []).reduce((sum, debt) => sum + debt.pendingAmount, 0);
    
    // Dívidas do mês
    const debtsThisMonth = (debts || []).filter(debt => {
      const debtDate = new Date(debt.date);
      return debtDate.getMonth() === thisMonth && debtDate.getFullYear() === thisYear;
    });
    const monthlyDebts = debtsThisMonth.reduce((sum, debt) => sum + debt.totalValue, 0);
    const monthlyPaidDebts = debtsThisMonth.reduce((sum, debt) => sum + debt.paidAmount, 0);

    // Cheques
    const checksToday = (checks || []).filter(check => check.dueDate === today);
    const overdueChecks = (checks || []).filter(check => check.dueDate < today && check.status === 'pendente');
    const totalChecksValue = (checks || []).reduce((sum, check) => sum + check.value, 0);

    // Boletos
    const boletosToday = (boletos || []).filter(boleto => boleto.dueDate === today);
    const overdueBoletos = (boletos || []).filter(boleto => boleto.dueDate < today && boleto.status === 'pendente');
    const totalBoletosValue = (boletos || []).reduce((sum, boleto) => sum + boleto.value, 0);

    // Funcionários
    const activeEmployees = (employees || []).filter(emp => emp.isActive);
    const sellers = activeEmployees.filter(emp => emp.isSeller);
    const totalPayroll = activeEmployees.reduce((sum, emp) => sum + emp.salary, 0);

    // Comissões
    const pendingCommissions = (employeeCommissions || []).filter(comm => comm.status === 'pendente');
    const totalPendingCommissions = pendingCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
    const monthlyCommissions = (employeeCommissions || []).filter(comm => {
      const commDate = new Date(comm.date);
      return commDate.getMonth() === thisMonth && commDate.getFullYear() === thisYear;
    });

    // Caixa
    const currentCashBalance = cashBalance?.currentBalance || 0;

    // Lucro líquido do mês
    const monthlyNetProfit = monthlyReceived - monthlyPaidDebts;
    const monthlyProfitMargin = monthlyReceived > 0 ? (monthlyNetProfit / monthlyReceived) * 100 : 0;
    
    // Dívidas para pagar no mês atual
    const monthlyPayableDebts = (debts || []).filter(debt => {
      const debtDate = new Date(debt.date);
      return debtDate.getMonth() === thisMonth && 
             debtDate.getFullYear() === thisYear && 
             !debt.isPaid;
    });
    
    // Vendas para receber no mês atual
    const monthlyReceivableSales = (sales || []).filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getMonth() === thisMonth && 
             saleDate.getFullYear() === thisYear && 
             sale.pendingAmount > 0;
    });

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
      cashBalance: currentCashBalance,
      netProfit: monthlyNetProfit,
      profitMargin: monthlyProfitMargin,
      monthlyPayableDebts,
      monthlyReceivableSales,
      totalPaidToday
    };
  }, [sales, debts, employees, checks, boletos, employeeCommissions, cashBalance]);

  // Dados para gráficos - últimos 30 dias
  const chartData = useMemo(() => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailySales = (sales || []).filter(sale => sale.date === dateStr);
      const dailyDebts = (debts || []).filter(debt => debt.date === dateStr);
      
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
  }, [sales, debts]);

  // Distribuição de métodos de pagamento
  const paymentMethodsData = useMemo(() => {
    const methods = {};
    (sales || []).forEach(sale => {
      (sale.paymentMethods || []).forEach(method => {
        const methodName = method.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (!methods[methodName]) {
          methods[methodName] = 0;
        }
        methods[methodName] += method.amount;
      });
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [sales]);

  // Top vendedores
  const topSellers = useMemo(() => {
    const sellerStats = {};
    
    // Initialize all active sellers with default values
    (employees || []).forEach(employee => {
      if (employee.isActive && employee.isSeller) {
        sellerStats[employee.id] = {
          name: employee.name,
          totalSales: 0,
          totalValue: 0,
          commissions: 0
        };
      }
    });
    
    (sales || []).forEach(sale => {
      if (sale.sellerId) {
        const seller = (employees || []).find(e => e.id === sale.sellerId);
        if (seller && sellerStats[seller.id]) {
          sellerStats[seller.id].totalSales += 1;
          sellerStats[seller.id].totalValue += sale.totalValue;
        }
      }
    });
    
    // Adicionar comissões
    (employeeCommissions || []).forEach(comm => {
      const seller = (employees || []).find(e => e.id === comm.employeeId);
      if (seller && sellerStats[seller.id]) {
        sellerStats[seller.id].commissions += comm.commissionAmount;
      }
    });
    
    return Object.values(sellerStats)
      .filter(seller => {
        return seller && 
               typeof seller === 'object' && 
               'name' in seller &&
               'totalSales' in seller &&
               'totalValue' in seller &&
               'commissions' in seller;
      })
      .map(seller => {
        const safeSeller = {
          name: String(seller.name || 'Vendedor'),
          totalSales: Number(seller.totalSales || 0),
          totalValue: Number(seller.totalValue || 0),
          commissions: Number(seller.commissions || 0)
        };
        
        // Garantir valores válidos
        if (isNaN(safeSeller.totalSales) || !isFinite(safeSeller.totalSales)) {
          safeSeller.totalSales = 0;
        }
        if (isNaN(safeSeller.totalValue) || !isFinite(safeSeller.totalValue)) {
          safeSeller.totalValue = 0;
        }
        if (isNaN(safeSeller.commissions) || !isFinite(safeSeller.commissions)) {
          safeSeller.commissions = 0;
        }
        
        return safeSeller;
      })
      .sort((a, b) => {
        const aValue = Number(a?.totalValue || 0);
        const bValue = Number(b?.totalValue || 0);
        if (isNaN(aValue) || isNaN(bValue)) return 0;
        return bValue - aValue;
      })
      .slice(0, 5);
  }, [sales, employees, employeeCommissions]);

  if (loading) {
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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">Aviso do Sistema</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Vendas */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900">Vendas Hoje</h3>
              <p className="text-2xl font-black text-green-700">
                R$ {metrics.totalSalesToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600">{(sales || []).filter(s => s.date === today).length} vendas</p>
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
              <h3 className="font-bold text-emerald-900">Recebido Hoje</h3>
              <p className="text-2xl font-black text-emerald-700">
                R$ {metrics.totalReceivedToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              <h3 className="font-bold text-red-900">Dívidas Hoje</h3>
              <p className="text-2xl font-black text-red-700">
                R$ {metrics.totalDebtsToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-red-600">{(debts || []).filter(d => d.date === today).length} dívidas</p>
            </div>
          </div>
        </div>

        {/* Valor Pago Hoje */}
        <div className="card bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-600">
              <ArrowDownCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900">Pago Hoje</h3>
              <p className="text-2xl font-black text-orange-700">
                R$ {metrics.totalPaidToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-orange-600">Efetivamente pago</p>
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

      {/* Dívidas para Pagar no Mês */}
      {metrics.monthlyPayableDebts.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-red-600">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-red-900">Dívidas para Pagar este Mês</h3>
            <span className="text-red-600 font-semibold">
              Total: R$ {metrics.monthlyPayableDebts.reduce((sum, debt) => sum + debt.pendingAmount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto modern-scrollbar">
            {metrics.monthlyPayableDebts.map(debt => (
              <div key={debt.id} className="p-6 bg-red-50 rounded-xl border border-red-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-red-900 text-lg">{debt.company}</h4>
                    <p className="text-red-700">{debt.description}</p>
                    <p className="text-sm text-red-600">
                      Data: {new Date(debt.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-red-600">
                      R$ {debt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800">
                      PENDENTE
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Valor Total:</strong> R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Valor Pago:</strong> R$ {debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Valor Pendente:</strong> R$ {debt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p><strong>Métodos de Pagamento:</strong></p>
                    {(debt.paymentMethods || []).map((method, index) => (
                      <p key={index} className="text-red-600 font-medium">
                        • {method.type.replace('_', ' ')}: R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    ))}
                  </div>
                </div>
                
                {debt.paymentDescription && (
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <p className="text-sm text-red-700"><strong>Descrição do Pagamento:</strong> {debt.paymentDescription}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendas para Receber no Mês */}
      {metrics.monthlyReceivableSales.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Vendas para Receber este Mês</h3>
            <span className="text-green-600 font-semibold">
              Total: R$ {metrics.monthlyReceivableSales.reduce((sum, sale) => sum + sale.pendingAmount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto modern-scrollbar">
            {metrics.monthlyReceivableSales.map(sale => (
              <div key={sale.id} className="p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-green-900 text-lg">{sale.client}</h4>
                    <p className="text-green-700">{typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}</p>
                    <p className="text-sm text-green-600">
                      Data: {new Date(sale.date).toLocaleDateString('pt-BR')}
                    </p>
                    {sale.deliveryDate && (
                      <p className="text-sm text-green-600">
                        Entrega: {new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-600">
                      R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      sale.status === 'pago' ? 'bg-green-200 text-green-800' :
                      sale.status === 'parcial' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-orange-200 text-orange-800'
                    }`}>
                      {sale.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Valor Total:</strong> R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Valor Recebido:</strong> R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Valor Pendente:</strong> R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p><strong>Métodos de Pagamento:</strong></p>
                    {(sale.paymentMethods || []).map((method, index) => (
                      <p key={index} className="text-green-600 font-medium">
                        • {method.type.replace('_', ' ')}: R$ {method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    ))}
                  </div>
                </div>
                
                {sale.sellerId && (
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <p className="text-sm text-green-700">
                      <strong>Vendedor:</strong> {(employees || []).find(e => e.id === sale.sellerId)?.name || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
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
            {topSellers.map((seller, index) => {
              // Validação extra de segurança
              if (!seller || typeof seller !== 'object') {
                return null;
              }
              
              const sellerName = String(seller.name || 'Vendedor');
              const totalSales = Number(seller.totalSales || 0);
              const totalValue = Number(seller.totalValue || 0);
              const commissions = Number(seller.commissions || 0);
              
              // Verificar se os valores são válidos antes de renderizar
              if (isNaN(totalSales) || isNaN(totalValue) || isNaN(commissions)) {
                return null;
              }
              
              return (
                <div key={`seller-${index}-${sellerName}`} className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-green-900">{sellerName}</h4>
                        <p className="text-sm text-green-700">{totalSales} vendas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-green-600">
                        R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-green-600 font-bold">
                        Comissão: R$ {commissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }).filter(Boolean)}
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
              const count = (sales || []).filter(sale => sale.status === status).length;
              const value = (sales || []).filter(sale => sale.status === status).reduce((sum, sale) => sum + sale.totalValue, 0);
              
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
                  {(debts || []).filter(debt => debt.isPaid).length} dívidas
                </p>
                <p className="text-sm text-slate-600">
                  R$ {Number(metrics.totalPaidDebts || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
              <span className="font-medium text-slate-900">Pendentes</span>
              <div className="text-right">
                <p className="font-bold text-red-600">
                  {(debts || []).filter(debt => !debt.isPaid).length} dívidas
                </p>
                <p className="text-sm text-slate-600">
                  R$ {Number(metrics.totalPendingDebts || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  R$ {Number(metrics.totalReceived || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
              <span className="font-medium text-slate-900">A Receber</span>
              <div className="text-right">
                <p className="font-bold text-orange-600">
                  R$ {Number(metrics.totalPending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
              <span className="font-medium text-slate-900">Cheques</span>
              <div className="text-right">
                <p className="font-bold text-blue-600">
                  R$ {Number(metrics.totalChecksValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">{(checks || []).length} cheques</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-xl">
              <span className="font-medium text-slate-900">Boletos</span>
              <div className="text-right">
                <p className="font-bold text-cyan-600">
                  R$ {Number(metrics.totalBoletosValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">{(boletos || []).length} boletos</p>
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
                R$ {Number(metrics.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-green-600 font-semibold">Vendas</p>
              <p className="text-3xl font-black text-green-700">
                {(sales || []).filter(sale => {
                  const saleDate = new Date(sale.date);
                  return saleDate.getMonth() === new Date().getMonth() && saleDate.getFullYear() === new Date().getFullYear();
                }).length}
              </p>
            </div>
            <div>
              <p className="text-green-600 font-semibold">Comissões</p>
              <p className="text-3xl font-black text-green-700">
                {Number(metrics.monthlyCommissions || 0)}
              </p>
            </div>
            <div>
              <p className="text-green-600 font-semibold">Lucro</p>
              <p className={`text-3xl font-black ${(metrics.netProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                R$ {Number(metrics.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info - Mostrar apenas se houver problemas */}
      {!checkSupabase() && (
        <div className="card bg-yellow-50 border-yellow-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <h3 className="text-xl font-bold text-yellow-900">Informações do Sistema</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <p><strong>Supabase Configurado:</strong> {checkSupabase() ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>Modo de Operação:</strong> {checkSupabase() ? 'Conectado ao banco' : 'Local (dados não persistem)'}</p>
            <p><strong>Vendas Carregadas:</strong> {(sales || []).length}</p>
            <p><strong>Dívidas Carregadas:</strong> {(debts || []).length}</p>
            <p><strong>Funcionários Carregados:</strong> {(employees || []).length}</p>
            <p><strong>Cheques Carregados:</strong> {(checks || []).length}</p>
            <p><strong>Boletos Carregados:</strong> {(boletos || []).length}</p>
            <p><strong>Comissões Carregadas:</strong> {(employeeCommissions || []).length}</p>
            <p><strong>Estado de Loading:</strong> {loading ? 'Carregando...' : 'Concluído'}</p>
            {error && <p><strong>Erro:</strong> {error}</p>}
          </div>
          
          {checkSupabase() && (
            <div className="mt-6">
            <button
              onClick={loadAllData}
              className="btn-primary"
            >
              Recarregar Dados
            </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}