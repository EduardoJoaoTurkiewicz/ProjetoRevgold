import React, { useState, useMemo } from 'react';
import { FileText, Calendar, Download, Filter, DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, Users, CreditCard, Receipt, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export function Reports() {
  const { state } = useApp();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primeiro dia do mês
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Filtrar dados por período
  const filteredData = useMemo(() => {
    const sales = state.sales.filter(sale => 
      sale.date >= startDate && sale.date <= endDate
    );
    
    const debts = state.debts.filter(debt => 
      debt.date >= startDate && debt.date <= endDate
    );
    
    const receivables = [];
    const payables = [];
    
    // Calcular recebimentos do período
    state.checks.forEach(check => {
      if (check.dueDate >= startDate && check.dueDate <= endDate) {
        receivables.push({
          id: check.id,
          type: 'cheque',
          client: check.client,
          amount: check.value,
          dueDate: check.dueDate,
          status: check.status,
          description: `Cheque - Parcela ${check.installmentNumber}/${check.totalInstallments}`,
          saleId: check.saleId
        });
      }
    });
    
    state.boletos.forEach(boleto => {
      if (boleto.dueDate >= startDate && boleto.dueDate <= endDate) {
        receivables.push({
          id: boleto.id,
          type: 'boleto',
          client: boleto.client,
          amount: boleto.value,
          dueDate: boleto.dueDate,
          status: boleto.status,
          description: `Boleto - Parcela ${boleto.installmentNumber}/${boleto.totalInstallments}`,
          saleId: boleto.saleId
        });
      }
    });
    
    // Calcular pagamentos do período
    state.debts.forEach(debt => {
      debt.paymentMethods.forEach(method => {
        if (method.installments && method.installments > 1) {
          for (let i = 0; i < method.installments; i++) {
            const dueDate = new Date(method.startDate || debt.date);
            dueDate.setDate(dueDate.getDate() + (i * (method.installmentInterval || 30)));
            const dueDateStr = dueDate.toISOString().split('T')[0];
            
            if (dueDateStr >= startDate && dueDateStr <= endDate) {
              payables.push({
                id: `${debt.id}-${i}`,
                type: method.type,
                company: debt.company,
                amount: method.installmentValue || 0,
                dueDate: dueDateStr,
                description: `${debt.description} - Parcela ${i + 1}/${method.installments}`,
                debtId: debt.id
              });
            }
          }
        } else if (debt.date >= startDate && debt.date <= endDate) {
          payables.push({
            id: debt.id,
            type: method.type,
            company: debt.company,
            amount: method.amount,
            dueDate: debt.date,
            description: debt.description,
            debtId: debt.id
          });
        }
      });
    });
    
    return { sales, debts, receivables, payables };
  }, [state, startDate, endDate]);

  // Calcular totais
  const totals = useMemo(() => {
    const totalSales = filteredData.sales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalReceived = filteredData.sales.reduce((sum, sale) => sum + sale.receivedAmount, 0);
    const totalPendingSales = filteredData.sales.reduce((sum, sale) => sum + sale.pendingAmount, 0);
    
    const totalDebts = filteredData.debts.reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalPaidDebts = filteredData.debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
    const totalPendingDebts = filteredData.debts.reduce((sum, debt) => sum + debt.pendingAmount, 0);
    
    const totalReceivables = filteredData.receivables.reduce((sum, item) => sum + item.amount, 0);
    const totalPayables = filteredData.payables.reduce((sum, item) => sum + item.amount, 0);
    
    const cashBalance = state.cashBalance?.currentBalance || 0;
    const netProfit = totalReceived - totalPaidDebts;
    const profitMargin = totalReceived > 0 ? (netProfit / totalReceived) * 100 : 0;
    
    return {
      totalSales,
      totalReceived,
      totalPendingSales,
      totalDebts,
      totalPaidDebts,
      totalPendingDebts,
      totalReceivables,
      totalPayables,
      cashBalance,
      netProfit,
      profitMargin
    };
  }, [filteredData, state.cashBalance]);

  // Dados para gráficos
  const salesByDay = useMemo(() => {
    const dailyData = {};
    filteredData.sales.forEach(sale => {
      const day = new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dailyData[day]) {
        dailyData[day] = { day, vendas: 0, recebido: 0 };
      }
      dailyData[day].vendas += sale.totalValue;
      dailyData[day].recebido += sale.receivedAmount;
    });
    return Object.values(dailyData);
  }, [filteredData.sales]);

  const paymentMethodsData = useMemo(() => {
    const methods = {};
    filteredData.sales.forEach(sale => {
      sale.paymentMethods.forEach(method => {
        const methodName = method.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (!methods[methodName]) {
          methods[methodName] = 0;
        }
        methods[methodName] += method.amount;
      });
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [filteredData.sales]);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório Financeiro - RevGold', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, pageWidth / 2, 30, { align: 'center' });
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 40, { align: 'center' });
      
      let yPosition = 60;
      
      // Resumo Executivo
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumo Executivo', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const summaryData = [
        ['Total de Vendas:', `R$ ${totals.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Valor Recebido:', `R$ ${totals.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Valor Pendente (Vendas):', `R$ ${totals.totalPendingSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Total de Dívidas:', `R$ ${totals.totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Valor Pago (Dívidas):', `R$ ${totals.totalPaidDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Lucro Líquido:', `R$ ${totals.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Margem de Lucro:', `${totals.profitMargin.toFixed(2)}%`],
        ['Saldo em Caixa:', `R$ ${totals.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
      ];
      
      summaryData.forEach(([label, value]) => {
        pdf.text(label, 25, yPosition);
        pdf.text(value, 120, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Vendas do Período
      if (filteredData.sales.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Vendas do Período', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        
        filteredData.sales.forEach((sale, index) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(`${index + 1}. ${sale.client}`, 25, yPosition);
          pdf.text(`${new Date(sale.date).toLocaleDateString('pt-BR')}`, 80, yPosition);
          pdf.text(`R$ ${sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 120, yPosition);
          pdf.text(sale.status.toUpperCase(), 160, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      }
      
      // Salvar PDF
      pdf.save(`relatorio-financeiro-${startDate}-${endDate}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 modern-shadow-xl">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios Financeiros</h1>
          <p className="text-slate-600 text-lg">Análise completa e exportação de dados</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-900">Filtros de Período</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="form-group">
            <label className="form-label">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Ações</label>
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="btn-primary w-full flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPDF ? 'Gerando PDF...' : 'Exportar PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-blue-600">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-blue-900">Resumo Executivo</h3>
          <span className="text-blue-600 font-semibold">
            {new Date(startDate).toLocaleDateString('pt-BR')} - {new Date(endDate).toLocaleDateString('pt-BR')}
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-100 rounded-xl">
            <h4 className="font-bold text-green-900 mb-2">Vendas</h4>
            <p className="text-2xl font-black text-green-700">
              R$ {totals.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-green-600">{filteredData.sales.length} vendas</p>
          </div>
          
          <div className="text-center p-4 bg-emerald-100 rounded-xl">
            <h4 className="font-bold text-emerald-900 mb-2">Recebido</h4>
            <p className="text-2xl font-black text-emerald-700">
              R$ {totals.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-emerald-600">Efetivamente recebido</p>
          </div>
          
          <div className="text-center p-4 bg-red-100 rounded-xl">
            <h4 className="font-bold text-red-900 mb-2">Dívidas</h4>
            <p className="text-2xl font-black text-red-700">
              R$ {totals.totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-red-600">{filteredData.debts.length} dívidas</p>
          </div>
          
          <div className="text-center p-4 bg-purple-100 rounded-xl">
            <h4 className="font-bold text-purple-900 mb-2">Lucro Líquido</h4>
            <p className={`text-2xl font-black ${totals.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              R$ {totals.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-purple-600">{totals.profitMargin.toFixed(1)}% margem</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-100 rounded-xl text-center">
          <h4 className="font-bold text-blue-900 mb-2">Saldo Atual em Caixa</h4>
          <p className="text-3xl font-black text-blue-700">
            R$ {totals.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Vendas e Dívidas do Período */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendas */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Vendas do Período</h3>
          </div>
          
          {filteredData.sales.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto modern-scrollbar">
              {filteredData.sales.map(sale => (
                <div key={sale.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-green-900">{sale.client}</h4>
                      <p className="text-sm text-green-700">
                        {new Date(sale.date).toLocaleDateString('pt-BR')}
                        {sale.deliveryDate && ` • Entrega: ${new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}`}
                      </p>
                      {sale.sellerId && (
                        <p className="text-sm text-green-600">
                          Vendedor: {state.employees.find(e => e.id === sale.sellerId)?.name || 'N/A'}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-green-600">
                        R$ {sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        sale.status === 'pago' ? 'bg-green-200 text-green-800' :
                        sale.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sale.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-green-600">
                    <p>Recebido: R$ {sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p>Pendente: R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
              
              <div className="p-4 bg-green-200 rounded-xl border-2 border-green-300">
                <div className="text-center">
                  <h4 className="font-bold text-green-900 mb-2">Total de Vendas</h4>
                  <p className="text-3xl font-black text-green-700">
                    R$ {totals.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-green-600">{filteredData.sales.length} vendas realizadas</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-green-300" />
              <p className="text-green-600">Nenhuma venda no período selecionado</p>
            </div>
          )}
        </div>

        {/* Dívidas */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-red-600">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-red-900">Dívidas do Período</h3>
          </div>
          
          {filteredData.debts.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto modern-scrollbar">
              {filteredData.debts.map(debt => (
                <div key={debt.id} className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-red-900">{debt.company}</h4>
                      <p className="text-sm text-red-700">
                        {new Date(debt.date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm text-red-600">{debt.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600">
                        R$ {debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        debt.isPaid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {debt.isPaid ? 'PAGO' : 'PENDENTE'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-red-600">
                    <p>Pago: R$ {debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p>Pendente: R$ {debt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
              
              <div className="p-4 bg-red-200 rounded-xl border-2 border-red-300">
                <div className="text-center">
                  <h4 className="font-bold text-red-900 mb-2">Total de Dívidas</h4>
                  <p className="text-3xl font-black text-red-700">
                    R$ {totals.totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-red-600">{filteredData.debts.length} dívidas registradas</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingDown className="w-16 h-16 mx-auto mb-4 text-red-300" />
              <p className="text-red-600">Nenhuma dívida no período selecionado</p>
            </div>
          )}
        </div>
      </div>

      {/* Valores a Receber e a Pagar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* A Receber */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-green-600">
              <ArrowUpCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">Valores a Receber</h3>
          </div>
          
          {filteredData.receivables.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto modern-scrollbar">
              {filteredData.receivables.map(item => (
                <div key={item.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-green-900">{item.client}</h4>
                      <p className="text-sm text-green-700">{item.description}</p>
                      <p className="text-sm text-green-600">
                        Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-green-600">
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.status === 'compensado' ? 'bg-green-200 text-green-800' :
                        item.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="p-4 bg-green-200 rounded-xl border-2 border-green-300">
                <div className="text-center">
                  <h4 className="font-bold text-green-900 mb-2">Total a Receber</h4>
                  <p className="text-3xl font-black text-green-700">
                    R$ {totals.totalReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-green-600">{filteredData.receivables.length} recebimentos</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ArrowUpCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
              <p className="text-green-600">Nenhum valor a receber no período</p>
            </div>
          )}
        </div>

        {/* A Pagar */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-red-600">
              <ArrowDownCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-red-900">Valores a Pagar</h3>
          </div>
          
          {filteredData.payables.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto modern-scrollbar">
              {filteredData.payables.map(item => (
                <div key={item.id} className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-red-900">{item.company}</h4>
                      <p className="text-sm text-red-700">{item.description}</p>
                      <p className="text-sm text-red-600">
                        Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600">
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800">
                        {item.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="p-4 bg-red-200 rounded-xl border-2 border-red-300">
                <div className="text-center">
                  <h4 className="font-bold text-red-900 mb-2">Total a Pagar</h4>
                  <p className="text-3xl font-black text-red-700">
                    R$ {totals.totalPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-red-600">{filteredData.payables.length} pagamentos</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ArrowDownCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
              <p className="text-red-600">Nenhum valor a pagar no período</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendas por Dia */}
        <div className="card modern-shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-blue-600">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Vendas por Dia</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="vendas" fill="#10b981" name="Vendas" />
              <Bar dataKey="recebido" fill="#059669" name="Recebido" />
            </BarChart>
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
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Informações Logísticas */}
      <div className="card modern-shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-orange-600">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-orange-900">Informações Logísticas</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Clientes em Dívida */}
          <div className="p-6 bg-orange-50 rounded-xl border border-orange-200">
            <h4 className="font-bold text-orange-900 mb-4">Clientes em Dívida</h4>
            <div className="space-y-2">
              {state.sales.filter(sale => sale.pendingAmount > 0).map(sale => (
                <div key={sale.id} className="flex justify-between text-sm">
                  <span className="text-orange-700">{sale.client}</span>
                  <span className="font-bold text-orange-600">
                    R$ {sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {state.sales.filter(sale => sale.pendingAmount > 0).length === 0 && (
                <p className="text-orange-600 text-center">Nenhum cliente em dívida</p>
              )}
            </div>
          </div>

          {/* Entregas Programadas */}
          <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-4">Entregas Programadas</h4>
            <div className="space-y-2">
              {state.sales.filter(sale => sale.deliveryDate && sale.deliveryDate >= today).map(sale => (
                <div key={sale.id} className="text-sm">
                  <p className="text-blue-700 font-medium">{sale.client}</p>
                  <p className="text-blue-600">
                    {new Date(sale.deliveryDate!).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
              {state.sales.filter(sale => sale.deliveryDate && sale.deliveryDate >= today).length === 0 && (
                <p className="text-blue-600 text-center">Nenhuma entrega programada</p>
              )}
            </div>
          </div>

          {/* Vencimentos Próximos */}
          <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-200">
            <h4 className="font-bold text-yellow-900 mb-4">Vencimentos Próximos (7 dias)</h4>
            <div className="space-y-2">
              {[...state.checks, ...state.boletos]
                .filter(item => {
                  const dueDate = new Date(item.dueDate);
                  const today = new Date();
                  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays <= 7 && diffDays >= 0 && item.status === 'pendente';
                })
                .map(item => (
                  <div key={item.id} className="text-sm">
                    <p className="text-yellow-700 font-medium">{item.client}</p>
                    <p className="text-yellow-600">
                      {new Date(item.dueDate).toLocaleDateString('pt-BR')} - 
                      R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}