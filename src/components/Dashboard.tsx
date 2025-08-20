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
  FileText,
  Target,
  TrendingDown,
  Activity,
  PieChart,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts';
import { isSupabaseConfigured } from '../lib/supabase';
import { Database, Wifi, WifiOff } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

const Dashboard: React.FC = () => {
  const { state } = useApp();

  // Calculate metrics for TODAY only
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayStr = today.toISOString().split('T')[0];
  
  const metrics = useMemo(() => {
    // Sales made today
    const todaySales = state.sales.filter(sale => sale.date === todayStr);
    const todayTotalSales = todaySales.reduce((sum, sale) => sum + sale.totalValue, 0);
    
    // Amount actually received today (payments that were processed today)
    let todayReceived = 0;
    
    // Check for payments received today from any sales
    state.sales.forEach(sale => {
      sale.paymentMethods.forEach(method => {
        // For immediate payment methods (dinheiro, pix, cartao_debito)
        if ((method.type === 'dinheiro' || method.type === 'pix' || method.type === 'cartao_debito') && sale.date === todayStr) {
          todayReceived += method.amount;
        }
        
        // For installment payments, check if any installment is due today
        if (method.installments && method.installments > 1) {
          for (let i = 0; i < method.installments; i++) {
            const dueDate = new Date(method.firstInstallmentDate || method.startDate || sale.date);
            dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
            
            if (dueDate.toISOString().split('T')[0] === todayStr) {
              todayReceived += method.installmentValue || 0;
            }
          }
        }
      });
    });
    
    // Check for checks compensated today
    state.checks.forEach(check => {
      if (check.status === 'compensado' && check.dueDate === todayStr) {
        todayReceived += check.value;
      }
    });
    
    // Check for boletos paid today
    state.boletos.forEach(boleto => {
      if (boleto.status === 'compensado' && boleto.dueDate === todayStr) {
        todayReceived += boleto.value;
      }
    });
    
    // Debts created today
    const todayDebts = state.debts.filter(debt => debt.date === todayStr);
    const todayTotalDebts = todayDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
    
    // Amount paid today (debts paid today)
    const todayPaid = todayDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);

    // Overall metrics for context
    const totalSales = state.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalReceived = state.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    const totalPending = state.sales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
    const totalDebts = state.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalDebtsPaid = state.debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    
    const netProfit = totalReceived - totalDebtsPaid;
    const profitMargin = totalReceived > 0 ? (netProfit / totalReceived) * 100 : 0;

    // Overdue items
    const overdueChecks = state.checks.filter(check => 
      check.dueDate < todayStr && check.status === 'pendente'
    );
    const overdueBoletos = state.boletos.filter(boleto => 
      boleto.dueDate < todayStr && boleto.status === 'pendente'
    );

    // Due today
    const dueTodayChecks = state.checks.filter(check => check.dueDate === todayStr);
    const dueTodayBoletos = state.boletos.filter(boleto => boleto.dueDate === todayStr);

    return {
      // Today's metrics
      todayTotalSales,
      todayReceived,
      todayTotalDebts,
      todayPaid,
      todaySalesCount: todaySales.length,
      todayDebtsCount: todayDebts.length,
      
      // Overall metrics
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
      overdueCount: overdueChecks.length + overdueBoletos.length,
      dueTodayCount: dueTodayChecks.length + dueTodayBoletos.length
    };
  }, [state, todayStr]);

  // Vendas a receber do mês atual
  const monthlyReceivables = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const receivables = [];

    // Cheques pendentes do mês atual
    state.checks.forEach(check => {
      const checkDate = new Date(check.dueDate);
      if (checkDate.getMonth() === currentMonth && 
          checkDate.getFullYear() === currentYear &&
          check.dueDate >= todayStr &&
          check.status === 'pendente') {
        const sale = state.sales.find(s => s.id === check.saleId);
        receivables.push({
          id: check.id,
          type: 'cheque',
          client: check.client,
          amount: check.value,
          dueDate: check.dueDate,
          saleDate: sale?.date || check.dueDate,
          description: `Cheque - ${check.installmentNumber ? `Parcela ${check.installmentNumber}/${check.totalInstallments}` : 'Pagamento único'}`,
          sale: sale
        });
      }
    });

    // Boletos pendentes do mês atual
    state.boletos.forEach(boleto => {
      const boletoDate = new Date(boleto.dueDate);
      if (boletoDate.getMonth() === currentMonth && 
          boletoDate.getFullYear() === currentYear &&
          boleto.dueDate >= todayStr &&
          boleto.status === 'pendente') {
        const sale = state.sales.find(s => s.id === boleto.saleId);
        receivables.push({
          id: boleto.id,
          type: 'boleto',
          client: boleto.client,
          amount: boleto.value,
          dueDate: boleto.dueDate,
          saleDate: sale?.date || boleto.dueDate,
          description: `Boleto - Parcela ${boleto.installmentNumber}/${boleto.totalInstallments}`,
          sale: sale
        });
      }
    });

    // Vendas com parcelas pendentes do mês atual
    state.sales.forEach(sale => {
      if (sale.status !== 'pago' && sale.pendingAmount > 0) {
        sale.paymentMethods.forEach((method, methodIndex) => {
          if (method.installments && method.installments > 1) {
            for (let i = 1; i < method.installments; i++) { // Começar da segunda parcela
              const dueDate = new Date(method.firstInstallmentDate || method.startDate || sale.date);
              dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
              const dueDateStr = dueDate.toISOString().split('T')[0];
              
              if (dueDate.getMonth() === currentMonth && 
                  dueDate.getFullYear() === currentYear &&
                  dueDateStr >= todayStr &&
                  method.type !== 'cheque' && method.type !== 'boleto') { // Evitar duplicatas
                receivables.push({
                  id: `${sale.id}-${methodIndex}-${i}`,
                  type: method.type,
                  client: sale.client,
                  amount: method.installmentValue || 0,
                  dueDate: dueDateStr,
                  saleDate: sale.date,
                  description: `${method.type.replace('_', ' ')} - Parcela ${i + 1}/${method.installments}`,
                  sale: sale
                });
              }
            }
          }
        });
      }
    });

    return receivables.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [state, currentMonth, currentYear]);

  // Dívidas a pagar do mês atual
  const monthlyPayables = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const payables = [];

    state.debts.forEach(debt => {
      if (!debt.isPaid && debt.pendingAmount > 0) {
        debt.paymentMethods.forEach((method, methodIndex) => {
          if (method.installments && method.installments > 1) {
            for (let i = 0; i < method.installments; i++) {
              const dueDate = new Date(method.startDate || debt.date);
              dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
              const dueDateStr = dueDate.toISOString().split('T')[0];
              
              if (dueDate.getMonth() === currentMonth && 
                  dueDate.getFullYear() === currentYear &&
                  dueDateStr >= todayStr) {
                payables.push({
                  id: `${debt.id}-${methodIndex}-${i}`,
                  type: method.type,
                  company: debt.company,
                  amount: method.installmentValue || 0,
                  dueDate: dueDateStr,
                  debtDate: debt.date,
                  description: `${debt.description} - Parcela ${i + 1}/${method.installments}`,
                  debt: debt
                });
              }
            }
          } else {
            // Pagamento único
            const debtDate = new Date(debt.date);
            if (debtDate.getMonth() === currentMonth && 
                debtDate.getFullYear() === currentYear &&
                debt.date >= todayStr) {
              payables.push({
                id: debt.id,
                type: method.type,
                company: debt.company,
                amount: method.amount,
                dueDate: debt.date,
                debtDate: debt.date,
                description: debt.description,
                debt: debt
              });
            }
          }
        });
      }
    });

    return payables.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [state, currentMonth, currentYear]);

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

  // Sales vs Debts comparison
  const salesVsDebtsData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      
      const daySales = state.sales.filter(sale => sale.date === dateStr);
      const dayDebts = state.debts.filter(debt => debt.date === dateStr);
      
      last7Days.push({
        day: dayName,
        vendas: daySales.reduce((sum, sale) => sum + sale.totalValue, 0),
        dividas: dayDebts.reduce((sum, debt) => sum + debt.totalValue, 0)
      });
    }
    return last7Days;
  }, [state.sales, state.debts]);

  // Status distribution
  const statusData = useMemo(() => {
    const paid = state.sales.filter(sale => sale.status === 'pago').length;
    const partial = state.sales.filter(sale => sale.status === 'parcial').length;
    const pending = state.sales.filter(sale => sale.status === 'pendente').length;
    
    return [
      { name: 'Pagas', value: paid, color: '#10b981' },
      { name: 'Parciais', value: partial, color: '#f59e0b' },
      { name: 'Pendentes', value: pending, color: '#ef4444' }
    ];
  }, [state.sales]);

  // Monthly growth data
  const monthlyGrowthData = useMemo(() => {
    const monthlyData = {};
    state.sales.forEach(sale => {
      const month = new Date(sale.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, total: 0, count: 0 };
      }
      monthlyData[month].total += sale.totalValue;
      monthlyData[month].count += 1;
    });
    
    const sortedData = Object.values(monthlyData).slice(-6);
    return sortedData.map((data, index) => ({
      ...data,
      growth: index > 0 ? ((data.total - sortedData[index - 1].total) / sortedData[index - 1].total * 100) : 0
    }));
  }, [state.sales]);

  // Top clients data
  const topClientsData = useMemo(() => {
    const clients = {};
    state.sales.forEach(sale => {
      if (!clients[sale.client]) {
        clients[sale.client] = { name: sale.client, total: 0, count: 0 };
      }
      clients[sale.client].total += sale.totalValue;
      clients[sale.client].count += 1;
    });
    return Object.values(clients)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
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
      {state.isLoading && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800">Carregando Sistema...</h3>
              <p className="text-blue-700">
                {isSupabaseConfigured() ? 'Conectando ao Supabase e carregando dados...' : 'Carregando dados locais...'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {state.error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800">Aviso do Sistema</h3>
              <p className="text-red-700">{state.error}</p>
              {!isSupabaseConfigured() && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  💡 Configure o Supabase para salvar dados permanentemente no banco de dados.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {!isSupabaseConfigured() && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-yellow-800">Modo Local Ativo</h3>
              <p className="text-yellow-700">
                Configure o Supabase para salvar dados permanentemente no banco de dados.
              </p>
              <p className="text-yellow-600 text-sm mt-2 font-medium">
                💡 Clique no botão "Connect to Supabase" no topo direito para configurar.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {isSupabaseConfigured() && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800">Supabase Conectado</h3>
              <p className="text-blue-700">
                Todos os dados estão sendo salvos automaticamente no banco de dados.
              </p>
              <p className="text-blue-600 text-sm mt-2 font-medium">
                ✅ Sistema pronto para uso em múltiplos dispositivos.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-green-800 mb-2">
            Olá, {state.user?.username}! 🌟
          </h1>
          <p className="text-xl text-green-700 font-bold">
            Aqui está o resumo do seu negócio hoje
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-green-600 font-bold">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long',
              year: 'numeric'
            })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-bold text-sm">Sistema Online</span>
          </div>
        </div>
      </div>

      {/* Key Metrics - Today's Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 modern-shadow-xl group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-green-700 modern-shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Vendas Hoje</h3>
              <p className="text-3xl font-black text-green-800">
                R$ {metrics.todayTotalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-700 font-semibold">{metrics.todaySalesCount} vendas</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-emerald-600 modern-shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Valor Recebido Hoje</h3>
              <p className="text-3xl font-black text-emerald-700">
                R$ {metrics.todayReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-emerald-600 font-semibold">
                {metrics.todayTotalSales > 0 ? ((metrics.todayReceived / metrics.todayTotalSales) * 100).toFixed(1) : 0}% do total
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-200 to-emerald-200 border-green-400 modern-shadow-xl group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-green-600 modern-shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Dívidas Feitas Hoje</h3>
              <p className="text-3xl font-black text-green-800">
                R$ {metrics.todayTotalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-700 font-semibold">{metrics.todayDebtsCount} dívidas</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-300 modern-shadow-xl group hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-emerald-700 modern-shadow-lg group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Valor Pago Hoje</h3>
              <p className="text-3xl font-black text-emerald-800">
                R$ {metrics.todayPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-emerald-700 font-semibold">Pagamentos realizados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Summary & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-700 modern-shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Resumo de Hoje</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-100 rounded-xl border border-green-200">
              <span className="font-semibold text-green-900">Vendas Realizadas</span>
              <div className="text-right">
                <p className="font-bold text-green-800">{metrics.todaySalesCount}</p>
                <p className="text-sm text-green-700">
                  R$ {metrics.todayTotalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-emerald-100 rounded-xl border border-emerald-200">
              <span className="font-semibold text-emerald-900">Dívidas Criadas</span>
              <div className="text-right">
                <p className="font-bold text-emerald-800">{metrics.todayDebtsCount}</p>
                <p className="text-sm text-emerald-700">
                  R$ {metrics.todayTotalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-200 rounded-xl border border-green-300">
              <span className="font-semibold text-green-900">Vencimentos</span>
              <div className="text-right">
                <p className="font-bold text-green-800">{metrics.dueTodayCount}</p>
                <p className="text-sm text-green-700">itens</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-red-600 modern-shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Alertas</h3>
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
              <div className="p-4 bg-green-100 rounded-xl border border-green-300">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-700" />
                  <div>
                    <p className="font-bold text-green-900">Tudo em dia!</p>
                    <p className="text-sm text-green-700">Nenhum item vencido</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-700 modern-shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Resumo Geral</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Funcionários</span>
              <span className="font-bold text-green-900">{metrics.employeesCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Cheques</span>
              <span className="font-bold text-green-900">{metrics.checksCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Boletos</span>
              <span className="font-bold text-green-900">{metrics.boletosCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Total Vendas</span>
              <span className="font-bold text-green-900">{metrics.salesCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Total Dívidas</span>
              <span className="font-bold text-green-900">{metrics.debtsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vendas a Receber do Mês */}
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
            <ArrowUpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-900">Vendas a Receber - {today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <p className="text-green-700 font-semibold">
              {monthlyReceivables.length} recebimento(s) • Total: R$ {monthlyReceivables.reduce((sum, item) => sum + item.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        {monthlyReceivables.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto modern-scrollbar">
            {monthlyReceivables.map(item => {
              const daysUntilDue = Math.ceil((new Date(item.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysUntilDue <= 3;
              const isSoon = daysUntilDue <= 7;
              
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    isUrgent ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                    isSoon ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                    'bg-green-50 border-green-200 hover:bg-green-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{item.client}</h4>
                      <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500">
                          <strong>Venda:</strong> {new Date(item.saleDate).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={`font-bold ${
                          isUrgent ? 'text-red-600' :
                          isSoon ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          <strong>Vencimento:</strong> {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-green-600 mb-1">
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.type === 'cheque' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'boleto' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.type === 'cheque' ? 'Cheque' :
                         item.type === 'boleto' ? 'Boleto' :
                         item.type.replace('_', ' ')}
                      </span>
                      <div className={`text-xs font-bold mt-1 ${
                        isUrgent ? 'text-red-600' :
                        isSoon ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {daysUntilDue === 0 ? 'Hoje!' :
                         daysUntilDue === 1 ? 'Amanhã' :
                         `${daysUntilDue} dias`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Total Geral */}
            <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border-2 border-green-300 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-black text-green-800">Total a Receber no Mês</h4>
                  <p className="text-green-700 font-semibold">{monthlyReceivables.length} recebimento(s)</p>
                </div>
                <p className="text-3xl font-black text-green-700">
                  R$ {monthlyReceivables.reduce((sum, item) => sum + item.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <ArrowUpCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
            <p className="text-green-600 font-medium">Nenhuma venda a receber neste mês</p>
            <p className="text-green-500 text-sm">Todos os recebimentos estão em dia!</p>
          </div>
        )}
      </div>

      {/* Dívidas a Pagar do Mês */}
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
            <ArrowDownCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-900">Dívidas a Pagar - {today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <p className="text-green-700 font-semibold">
              {monthlyPayables.length} pagamento(s) • Total: R$ {monthlyPayables.reduce((sum, item) => sum + item.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        {monthlyPayables.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto modern-scrollbar">
            {monthlyPayables.map(item => {
              const daysUntilDue = Math.ceil((new Date(item.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysUntilDue <= 3;
              const isSoon = daysUntilDue <= 7;
              
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    isUrgent ? 'bg-red-100 border-red-300 hover:bg-red-200' :
                    isSoon ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                    'bg-green-50 border-green-200 hover:bg-green-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{item.company}</h4>
                      <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500">
                          <strong>Dívida:</strong> {new Date(item.debtDate).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={`font-bold ${
                          isUrgent ? 'text-red-600' :
                          isSoon ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          <strong>Vencimento:</strong> {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-red-600 mb-1">
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        {item.type.replace('_', ' ')}
                      </span>
                      <div className={`text-xs font-bold mt-1 ${
                        isUrgent ? 'text-red-700' :
                        isSoon ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {daysUntilDue === 0 ? 'Hoje!' :
                         daysUntilDue === 1 ? 'Amanhã' :
                         `${daysUntilDue} dias`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Total Geral */}
            <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border-2 border-green-300 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-black text-green-800">Total a Pagar no Mês</h4>
                  <p className="text-green-700 font-semibold">{monthlyPayables.length} pagamento(s)</p>
                </div>
                <p className="text-3xl font-black text-green-700">
                  R$ {monthlyPayables.reduce((sum, item) => sum + item.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <ArrowDownCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
            <p className="text-green-600 font-medium">Nenhuma dívida a pagar neste mês</p>
            <p className="text-green-500 text-sm">Todos os pagamentos estão em dia!</p>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-700 modern-shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Evolução das Vendas</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
              <XAxis dataKey="month" stroke="#166534" />
              <YAxis stroke="#166534" />
              <Tooltip 
                formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                contentStyle={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
              />
              <Legend />
              <Line type="monotone" dataKey="vendas" stroke="#16a34a" strokeWidth={3} name="Vendas" />
              <Line type="monotone" dataKey="recebido" stroke="#059669" strokeWidth={3} name="Recebido" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sales vs Debts - Last 7 Days */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-emerald-700 modern-shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Vendas vs Dívidas (7 dias)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesVsDebtsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
              <XAxis dataKey="day" stroke="#166534" />
              <YAxis stroke="#166534" />
              <Tooltip 
                formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                contentStyle={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
              />
              <Legend />
              <Bar dataKey="vendas" fill="#16a34a" name="Vendas" />
              <Bar dataKey="dividas" fill="#dc2626" name="Dívidas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Distribution */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Métodos de Pagamento</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
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
                formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                contentStyle={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Status Distribution */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-emerald-600 modern-shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Status das Vendas</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `${value} vendas`}
                contentStyle={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Growth */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-700 modern-shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Crescimento Mensal</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
              <XAxis dataKey="month" stroke="#166534" />
              <YAxis stroke="#166534" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'total' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `${value.toFixed(1)}%`,
                  name === 'total' ? 'Vendas' : 'Crescimento'
                ]}
                contentStyle={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
              />
              <Legend />
              <Area type="monotone" dataKey="total" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} name="Vendas" />
              <Area type="monotone" dataKey="growth" stackId="2" stroke="#059669" fill="#059669" fillOpacity={0.4} name="Crescimento %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Clients */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-emerald-700 modern-shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Top 5 Clientes</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topClientsData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
              <XAxis type="number" stroke="#166534" />
              <YAxis dataKey="name" type="category" stroke="#166534" width={80} />
              <Tooltip 
                formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                contentStyle={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
              />
              <Bar dataKey="total" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-green-700 modern-shadow-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-green-900">Atividades Recentes</h3>
        </div>
        
        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-green-100 rounded-xl hover:bg-green-200 transition-colors border border-green-200">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'sale' ? 'bg-green-200 text-green-800' : 'bg-red-100 text-red-600'
                  }`}>
                    {activity.type === 'sale' ? 
                      <ShoppingCart className="w-5 h-5" /> : 
                      <CreditCard className="w-5 h-5" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">{activity.title}</p>
                    <p className="text-sm text-green-700">
                      {new Date(activity.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-900">
                    R$ {activity.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activity.status === 'pago' ? 'bg-green-200 text-green-800' :
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
            <Clock className="w-16 h-16 mx-auto mb-4 text-green-300" />
            <p className="text-green-600 font-medium">Nenhuma atividade recente</p>
            <p className="text-green-500 text-sm">Comece registrando vendas e dívidas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;