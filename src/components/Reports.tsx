import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, FileText, Download, Filter, Eye, X, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function Reports() {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Filter data based on date range
  const filteredSales = useMemo(() => {
    return state.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }, [state.sales, dateRange]);

  const filteredDebts = useMemo(() => {
    return state.debts.filter(debt => {
      const debtDate = new Date(debt.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return debtDate >= startDate && debtDate <= endDate;
    });
  }, [state.debts, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalReceived = filteredSales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    const totalPending = filteredSales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
    const totalDebts = filteredDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalDebtsPaid = filteredDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    const totalDebtsUnpaid = filteredDebts.reduce((sum, debt) => sum + debt.pendingAmount, 0);
    
    const netProfit = totalReceived - totalDebtsPaid;
    const profitMargin = totalReceived > 0 ? (netProfit / totalReceived) * 100 : 0;

    return {
      totalSales,
      totalReceived,
      totalPending,
      totalDebts,
      totalDebtsPaid,
      totalDebtsUnpaid,
      netProfit,
      profitMargin,
      salesCount: filteredSales.length,
      debtsCount: filteredDebts.length
    };
  }, [filteredSales, filteredDebts]);

  // Sales by month data
  const salesByMonth = useMemo(() => {
    const monthlyData = {};
    filteredSales.forEach(sale => {
      const month = new Date(sale.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, vendas: 0, recebido: 0, pendente: 0 };
      }
      monthlyData[month].vendas += sale.totalValue;
      monthlyData[month].recebido += sale.receivedAmount;
      monthlyData[month].pendente += sale.pendingAmount;
    });
    return Object.values(monthlyData);
  }, [filteredSales]);

  // Payment methods distribution
  const paymentMethodsData = useMemo(() => {
    const methods = {};
    filteredSales.forEach(sale => {
      sale.paymentMethods.forEach(method => {
        const methodName = method.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (!methods[methodName]) {
          methods[methodName] = 0;
        }
        methods[methodName] += method.amount;
      });
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  // Top clients
  const topClients = useMemo(() => {
    const clients = {};
    filteredSales.forEach(sale => {
      if (!clients[sale.client]) {
        clients[sale.client] = { name: sale.client, total: 0, count: 0 };
      }
      clients[sale.client].total += sale.totalValue;
      clients[sale.client].count += 1;
    });
    return Object.values(clients)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredSales]);

  // Employee performance (if employees exist)
  const employeePerformance = useMemo(() => {
    const performance = {};
    filteredSales.forEach(sale => {
      if (sale.sellerId) {
        const employee = state.employees.find(emp => emp.id === sale.sellerId);
        const employeeName = employee ? employee.name : 'Funcionário não encontrado';
        if (!performance[employeeName]) {
          performance[employeeName] = { name: employeeName, sales: 0, total: 0 };
        }
        performance[employeeName].sales += 1;
        performance[employeeName].total += sale.totalValue;
      }
    });
    return Object.values(performance).sort((a, b) => b.total - a.total);
  }, [filteredSales, state.employees]);

  const generatePDF = async () => {
    const element = document.getElementById('reports-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`relatorio-revgold-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const renderOverviewReport = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Vendas Totais</h3>
              <p className="text-2xl font-black text-green-700">
                R$ {metrics.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600 font-semibold">{metrics.salesCount} vendas</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Recebido</h3>
              <p className="text-2xl font-black text-blue-700">
                R$ {metrics.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                {((metrics.totalReceived / metrics.totalSales) * 100 || 0).toFixed(1)}% do total
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-600 modern-shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Pendente</h3>
              <p className="text-2xl font-black text-orange-700">
                R$ {metrics.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-orange-600 font-semibold">A receber</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 modern-shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-600 modern-shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 text-lg">Lucro Líquido</h3>
              <p className={`text-2xl font-black ${metrics.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                R$ {metrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-purple-600 font-semibold">
                {metrics.profitMargin.toFixed(1)}% margem
              </p>
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

      {/* Top Clients */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-purple-600 modern-shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Top 10 Clientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Vendas</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map((client, index) => (
                <tr key={client.name} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      {client.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700 font-medium">{client.count}</td>
                  <td className="py-3 px-4 text-sm font-bold text-green-600">
                    R$ {client.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-blue-600">
                    R$ {(client.total / client.count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Performance */}
      {employeePerformance.length > 0 && (
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-indigo-600 modern-shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Performance dos Vendedores</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Vendedor</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Vendas</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Total Vendido</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {employeePerformance.map((employee, index) => (
                  <tr key={employee.name} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        {employee.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700 font-medium">{employee.sales}</td>
                    <td className="py-3 px-4 text-sm font-bold text-green-600">
                      R$ {employee.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-blue-600">
                      R$ {(employee.total / employee.sales).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderSalesReport = () => (
    <div className="space-y-8">
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Relatório Detalhado de Vendas</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Cliente</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Produtos</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Recebido</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-700">
                    {new Date(sale.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-900">{sale.client}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">
                    {Array.isArray(sale.products) 
                      ? sale.products.map(p => `${p.quantity}x ${p.name}`).join(', ')
                      : sale.products}
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-green-600">
                    R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-blue-600">
                    R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      sale.status === 'pago' ? 'bg-green-100 text-green-800' :
                      sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {sale.status === 'pago' ? 'Pago' :
                       sale.status === 'parcial' ? 'Parcial' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFinancialReport = () => (
    <div className="space-y-8">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 modern-shadow-xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 modern-shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-green-900 text-lg mb-2">Receitas</h3>
            <p className="text-3xl font-black text-green-700">
              R$ {metrics.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-rose-50 border-red-200 modern-shadow-xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 modern-shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-red-900 text-lg mb-2">Despesas</h3>
            <p className="text-3xl font-black text-red-700">
              R$ {metrics.totalDebtsPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="text-center">
            <div className={`w-16 h-16 ${metrics.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600'} rounded-full flex items-center justify-center mx-auto mb-4 modern-shadow-lg`}>
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Resultado</h3>
            <p className={`text-3xl font-black ${metrics.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              R$ {metrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Financial Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Breakdown */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600 modern-shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Detalhamento das Receitas</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
              <span className="font-semibold text-green-800">Vendas Totais</span>
              <span className="font-bold text-green-700">
                R$ {metrics.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <span className="font-semibold text-blue-800">Recebido</span>
              <span className="font-bold text-blue-700">
                R$ {metrics.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl">
              <span className="font-semibold text-orange-800">A Receber</span>
              <span className="font-bold text-orange-700">
                R$ {metrics.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-red-600 modern-shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Detalhamento das Despesas</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
              <span className="font-semibold text-red-800">Dívidas Totais</span>
              <span className="font-bold text-red-700">
                R$ {metrics.totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
              <span className="font-semibold text-green-800">Pagas</span>
              <span className="font-bold text-green-700">
                R$ {metrics.totalDebtsPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl">
              <span className="font-semibold text-orange-800">Pendentes</span>
              <span className="font-bold text-orange-700">
                R$ {metrics.totalDebtsUnpaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReceivablesReport = () => {
    // Get all pending receivables (sales with pending amounts)
    const receivables = [];
    
    filteredSales.forEach(sale => {
      if (sale.pendingAmount > 0) {
        // Check for pending checks
        const saleChecks = state.checks.filter(check => 
          check.saleId === sale.id && check.status === 'pendente'
        );
        
        // Check for pending boletos
        const saleBoletos = state.boletos.filter(boleto => 
          boleto.saleId === sale.id && boleto.status === 'pendente'
        );
        
        // Check for pending installments
        const today = new Date().toISOString().split('T')[0];
        const pendingInstallments = [];
        
        sale.paymentMethods.forEach(method => {
          if (method.installments && method.installments > 1) {
            for (let i = 1; i < method.installments; i++) { // Skip first installment (already received)
              const dueDate = new Date(method.firstInstallmentDate || method.startDate || sale.date);
              dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
              const dueDateStr = dueDate.toISOString().split('T')[0];
              
              if (dueDateStr >= today && method.type !== 'cheque' && method.type !== 'boleto') {
                pendingInstallments.push({
                  installment: i + 1,
                  totalInstallments: method.installments,
                  amount: method.installmentValue || 0,
                  dueDate: dueDateStr,
                  type: method.type,
                  isOverdue: dueDateStr < today
                });
              }
            }
          }
        });
        
        receivables.push({
          sale,
          checks: saleChecks,
          boletos: saleBoletos,
          installments: pendingInstallments,
          totalPending: sale.pendingAmount
        });
      }
    });
    
    const totalReceivables = receivables.reduce((sum, item) => sum + item.totalPending, 0);
    
    return (
      <div className="space-y-8">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-blue-600 modern-shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-blue-900">Clientes em Dívida - Relatório Detalhado</h3>
          </div>
          
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl border border-blue-300">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-2xl font-bold text-blue-900">Total a Receber</h4>
                <p className="text-blue-700 font-semibold">{receivables.length} cliente(s) com pendências</p>
              </div>
              <p className="text-4xl font-black text-blue-700">
                R$ {totalReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          {receivables.length > 0 ? (
            <div className="space-y-6">
              {receivables.map((item, index) => {
                const today = new Date().toISOString().split('T')[0];
                const hasOverdueItems = [
                  ...item.checks.filter(c => c.dueDate < today),
                  ...item.boletos.filter(b => b.dueDate < today),
                  ...item.installments.filter(i => i.isOverdue)
                ].length > 0;
                
                return (
                  <div key={index} className={`p-6 rounded-2xl border-2 ${
                    hasOverdueItems ? 'bg-red-50 border-red-200' : 'bg-white border-blue-200'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">{item.sale.client}</h4>
                        <p className="text-slate-600">
                          Venda realizada em: {new Date(item.sale.date).toLocaleDateString('pt-BR')}
                        </p>
                        {item.sale.deliveryDate && (
                          <p className="text-slate-600">
                            Data de entrega: {new Date(item.sale.deliveryDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          R$ {item.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-slate-600">
                          Total da venda: R$ {item.sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="font-semibold text-slate-800 mb-2">Produtos Vendidos:</h5>
                      <p className="text-slate-600">
                        {Array.isArray(item.sale.products) 
                          ? item.sale.products.map(p => `${p.quantity}x ${p.name}`).join(', ')
                          : item.sale.products}
                      </p>
                    </div>
                    
                    {/* Pending Checks */}
                    {item.checks.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-slate-800 mb-2">Cheques Pendentes:</h5>
                        <div className="space-y-2">
                          {item.checks.map(check => (
                            <div key={check.id} className={`p-3 rounded-lg ${
                              check.dueDate < today ? 'bg-red-100 border border-red-200' : 'bg-yellow-100 border border-yellow-200'
                            }`}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">
                                    R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  {check.installmentNumber && (
                                    <span className="text-sm text-slate-600 ml-2">
                                      (Parcela {check.installmentNumber}/{check.totalInstallments})
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-medium ${
                                    check.dueDate < today ? 'text-red-600' : 'text-slate-600'
                                  }`}>
                                    Vencimento: {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                                  </p>
                                  {check.dueDate < today && (
                                    <span className="text-xs text-red-600 font-bold">VENCIDO</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Pending Boletos */}
                    {item.boletos.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-slate-800 mb-2">Boletos Pendentes:</h5>
                        <div className="space-y-2">
                          {item.boletos.map(boleto => (
                            <div key={boleto.id} className={`p-3 rounded-lg ${
                              boleto.dueDate < today ? 'bg-red-100 border border-red-200' : 'bg-blue-100 border border-blue-200'
                            }`}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">
                                    R$ {boleto.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-sm text-slate-600 ml-2">
                                    (Parcela {boleto.installmentNumber}/{boleto.totalInstallments})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-medium ${
                                    boleto.dueDate < today ? 'text-red-600' : 'text-slate-600'
                                  }`}>
                                    Vencimento: {new Date(boleto.dueDate).toLocaleDateString('pt-BR')}
                                  </p>
                                  {boleto.dueDate < today && (
                                    <span className="text-xs text-red-600 font-bold">VENCIDO</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Other Pending Installments */}
                    {item.installments.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-slate-800 mb-2">Outras Parcelas Pendentes:</h5>
                        <div className="space-y-2">
                          {item.installments.map((installment, idx) => (
                            <div key={idx} className={`p-3 rounded-lg ${
                              installment.isOverdue ? 'bg-red-100 border border-red-200' : 'bg-purple-100 border border-purple-200'
                            }`}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">
                                    R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-sm text-slate-600 ml-2">
                                    ({installment.type.replace('_', ' ')} - Parcela {installment.installment}/{installment.totalInstallments})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-medium ${
                                    installment.isOverdue ? 'text-red-600' : 'text-slate-600'
                                  }`}>
                                    Vencimento: {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                                  </p>
                                  {installment.isOverdue && (
                                    <span className="text-xs text-red-600 font-bold">VENCIDO</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.sale.observations && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <h5 className="font-semibold text-slate-800 mb-1">Observações:</h5>
                        <p className="text-sm text-slate-600">{item.sale.observations}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-blue-300" />
              <p className="text-blue-600 font-medium">Nenhum cliente com dívidas pendentes no período selecionado</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPayablesReport = () => {
    // Get all unpaid debts
    const payables = [];
    
    filteredDebts.forEach(debt => {
      if (!debt.isPaid && debt.pendingAmount > 0) {
        const today = new Date().toISOString().split('T')[0];
        const pendingInstallments = [];
        
        debt.paymentMethods.forEach(method => {
          if (method.installments && method.installments > 1) {
            for (let i = 0; i < method.installments; i++) {
              const dueDate = new Date(method.startDate || debt.date);
              dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
              const dueDateStr = dueDate.toISOString().split('T')[0];
              
              if (dueDateStr >= today) {
                pendingInstallments.push({
                  installment: i + 1,
                  totalInstallments: method.installments,
                  amount: method.installmentValue || 0,
                  dueDate: dueDateStr,
                  type: method.type,
                  isOverdue: dueDateStr < today
                });
              }
            }
          } else {
            // Single payment
            pendingInstallments.push({
              installment: 1,
              totalInstallments: 1,
              amount: method.amount,
              dueDate: debt.date,
              type: method.type,
              isOverdue: debt.date < today
            });
          }
        });
        
        payables.push({
          debt,
          installments: pendingInstallments,
          totalPending: debt.pendingAmount
        });
      }
    });
    
    const totalPayables = payables.reduce((sum, item) => sum + item.totalPending, 0);
    
    return (
      <div className="space-y-8">
        <div className="card bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-orange-600 modern-shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-orange-900">Dívidas da Empresa - Relatório Detalhado</h3>
          </div>
          
          <div className="mb-6 p-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl border border-orange-300">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-2xl font-bold text-orange-900">Total a Pagar</h4>
                <p className="text-orange-700 font-semibold">{payables.length} dívida(s) pendente(s)</p>
              </div>
              <p className="text-4xl font-black text-orange-700">
                R$ {totalPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          {payables.length > 0 ? (
            <div className="space-y-6">
              {payables.map((item, index) => {
                const today = new Date().toISOString().split('T')[0];
                const hasOverdueItems = item.installments.filter(i => i.isOverdue).length > 0;
                
                return (
                  <div key={index} className={`p-6 rounded-2xl border-2 ${
                    hasOverdueItems ? 'bg-red-50 border-red-200' : 'bg-white border-orange-200'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">{item.debt.company}</h4>
                        <p className="text-slate-600">
                          Dívida criada em: {new Date(item.debt.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">
                          R$ {item.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-slate-600">
                          Total da dívida: R$ {item.debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="font-semibold text-slate-800 mb-2">Descrição da Dívida:</h5>
                      <p className="text-slate-600">{item.debt.description}</p>
                    </div>
                    
                    {/* Payment Schedule */}
                    <div className="mb-4">
                      <h5 className="font-semibold text-slate-800 mb-2">Cronograma de Pagamentos:</h5>
                      <div className="space-y-2">
                        {item.installments.map((installment, idx) => (
                          <div key={idx} className={`p-3 rounded-lg ${
                            installment.isOverdue ? 'bg-red-100 border border-red-200' : 
                            installment.dueDate === today ? 'bg-yellow-100 border border-yellow-200' :
                            'bg-orange-100 border border-orange-200'
                          }`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">
                                  R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-sm text-slate-600 ml-2">
                                  ({installment.type.replace('_', ' ')} - Parcela {installment.installment}/{installment.totalInstallments})
                                </span>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-medium ${
                                  installment.isOverdue ? 'text-red-600' : 
                                  installment.dueDate === today ? 'text-yellow-600' :
                                  'text-slate-600'
                                }`}>
                                  {installment.dueDate === today ? 'Vence HOJE' :
                                   installment.isOverdue ? 'VENCIDO' :
                                   `Vencimento: ${new Date(installment.dueDate).toLocaleDateString('pt-BR')}`}
                                </p>
                                {installment.isOverdue && (
                                  <span className="text-xs text-red-600 font-bold">
                                    {Math.ceil((new Date().getTime() - new Date(installment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias em atraso
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Used Checks */}
                    {item.debt.checksUsed && item.debt.checksUsed.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-slate-800 mb-2">Cheques Utilizados:</h5>
                        <div className="space-y-2">
                          {item.debt.checksUsed.map(checkId => {
                            const check = state.checks.find(c => c.id === checkId);
                            return check ? (
                              <div key={checkId} className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-medium">{check.client}</span>
                                    <span className="text-sm text-slate-600 ml-2">
                                      R$ {check.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-slate-600">
                                      Status: {check.status === 'compensado' ? 'Compensado ✓' : check.status}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Vencimento: {new Date(check.dueDate).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    
                    {item.debt.paymentDescription && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <h5 className="font-semibold text-slate-800 mb-1">Descrição do Pagamento:</h5>
                        <p className="text-sm text-slate-600">{item.debt.paymentDescription}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-orange-300" />
              <p className="text-orange-600 font-medium">Nenhuma dívida pendente no período selecionado</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Relatórios e Análises</h1>
            <p className="text-slate-600 text-lg">Insights detalhados do seu negócio</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
          <button
            onClick={generatePDF}
            className="btn-primary flex items-center gap-2 modern-shadow-xl hover:modern-shadow-lg"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-blue-900">Filtros de Relatório</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="form-label text-blue-800">Data Inicial</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="input-field border-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="form-label text-blue-800">Data Final</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="input-field border-blue-200 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="form-label text-blue-800">Tipo de Relatório</label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="input-field border-blue-200 focus:border-blue-400"
              >
                <option value="overview">Visão Geral</option>
                <option value="sales">Vendas Detalhadas</option>
                <option value="financial">Financeiro</option>
                <option value="receivables">Clientes em Dívida</option>
                <option value="payables">Dívidas da Empresa</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div id="reports-content">
        {selectedReport === 'overview' && renderOverviewReport()}
        {selectedReport === 'sales' && renderSalesReport()}
        {selectedReport === 'financial' && renderFinancialReport()}
        {selectedReport === 'receivables' && renderReceivablesReport()}
        {selectedReport === 'payables' && renderPayablesReport()}
      </div>
    </div>
  );
}