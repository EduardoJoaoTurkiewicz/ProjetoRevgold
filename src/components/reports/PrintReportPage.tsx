import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PrintableReport } from './PrintableReport';
import { useAppContext } from '../../context/AppContext';
import { Loader2 } from 'lucide-react';

export function PrintReportPage() {
  const [searchParams] = useSearchParams();
  const { 
    sales, 
    debts, 
    checks, 
    boletos, 
    employees, 
    employeePayments,
    pixFees,
    cashBalance,
    loadAllData
  } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  // Get filters from URL params
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const methods = searchParams.get('methods')?.split(',').filter(Boolean) || [];
  const status = searchParams.get('status') || 'all';
  const auto = searchParams.get('auto') === '1';
  const user = searchParams.get('user') || 'Sistema';

  useEffect(() => {
    const generateReportData = async () => {
      try {
        // Ensure all data is loaded
        await loadAllData();
        
        // Filter data by period (same logic as Reports component)
        const periodSales = sales.filter(sale => 
          sale.date >= startDate && sale.date <= endDate
        );

        // Calculate received values
        const receivedValues = [];
        
        // Sales with instant payment
        periodSales.forEach(sale => {
          (sale.paymentMethods || []).forEach((method, methodIndex) => {
            if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
                (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
              receivedValues.push({
                id: `sale-${sale.id}-${methodIndex}`,
                date: sale.date,
                type: 'Venda',
                description: `Venda - ${sale.client}`,
                paymentMethod: method.type.replace('_', ' ').toUpperCase(),
                amount: method.amount,
                details: {
                  saleId: sale.id,
                  client: sale.client,
                  products: sale.products,
                  totalSaleValue: sale.totalValue,
                  seller: sale.sellerId ? employees.find(e => e.id === sale.sellerId)?.name : 'N/A'
                }
              });
            }
          });
        });

        // Checks compensated in period
        checks.forEach(check => {
          if (check.dueDate >= startDate && check.dueDate <= endDate && check.status === 'compensado') {
            receivedValues.push({
              id: `check-${check.id}`,
              date: check.dueDate,
              type: 'Cheque',
              description: `Cheque compensado - ${check.client}`,
              paymentMethod: 'CHEQUE',
              amount: check.value,
              details: {
                checkId: check.id,
                client: check.client,
                dueDate: check.dueDate,
                installment: check.installmentNumber && check.totalInstallments ? 
                  `${check.installmentNumber}/${check.totalInstallments}` : 'Único',
                usedFor: check.usedFor,
                isOwnCheck: check.isOwnCheck
              }
            });
          }
        });

        // Boletos paid in period
        boletos.forEach(boleto => {
          if (boleto.dueDate >= startDate && boleto.dueDate <= endDate && boleto.status === 'compensado') {
            const finalAmount = boleto.finalAmount || boleto.value;
            const notaryCosts = boleto.notaryCosts || 0;
            const netReceived = finalAmount - notaryCosts;
            
            receivedValues.push({
              id: `boleto-${boleto.id}`,
              date: boleto.dueDate,
              type: 'Boleto',
              description: `Boleto pago - ${boleto.client}`,
              paymentMethod: 'BOLETO',
              amount: netReceived,
              details: {
                boletoId: boleto.id,
                client: boleto.client,
                originalValue: boleto.value,
                finalAmount: finalAmount,
                notaryCosts: notaryCosts,
                installment: `${boleto.installmentNumber}/${boleto.totalInstallments}`,
                overdueAction: boleto.overdueAction
              }
            });
          }
        });

        // Period debts
        const periodDebts = debts.filter(debt => 
          debt.date >= startDate && debt.date <= endDate
        );

        // Calculate paid values
        const paidValues = [];

        // Paid debts in period
        periodDebts.forEach(debt => {
          if (debt.isPaid) {
            (debt.paymentMethods || []).forEach((method, methodIndex) => {
              if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
                paidValues.push({
                  id: `debt-${debt.id}-${methodIndex}`,
                  date: debt.date,
                  type: 'Dívida',
                  description: `Pagamento - ${debt.company}`,
                  paymentMethod: method.type.replace('_', ' ').toUpperCase(),
                  amount: method.amount,
                  details: {
                    debtId: debt.id,
                    company: debt.company,
                    description: debt.description,
                    totalDebtValue: debt.totalValue,
                    paidAmount: debt.paidAmount,
                    pendingAmount: debt.pendingAmount
                  }
                });
              }
            });
          }
        });

        // Own checks paid in period
        checks.forEach(check => {
          if (check.isOwnCheck && check.dueDate >= startDate && check.dueDate <= endDate && check.status === 'compensado') {
            paidValues.push({
              id: `own-check-${check.id}`,
              date: check.dueDate,
              type: 'Cheque Próprio',
              description: `Cheque próprio pago - ${check.client}`,
              paymentMethod: 'CHEQUE PRÓPRIO',
              amount: check.value,
              details: {
                checkId: check.id,
                client: check.client,
                usedFor: check.usedFor,
                installment: check.installmentNumber && check.totalInstallments ? 
                  `${check.installmentNumber}/${check.totalInstallments}` : 'Único'
              }
            });
          }
        });

        // Employee payments in period
        employeePayments.forEach(payment => {
          if (payment.paymentDate >= startDate && payment.paymentDate <= endDate) {
            const employee = employees.find(e => e.id === payment.employeeId);
            paidValues.push({
              id: `employee-payment-${payment.id}`,
              date: payment.paymentDate,
              type: 'Salário',
              description: `Pagamento de salário - ${employee?.name || 'Funcionário'}`,
              paymentMethod: 'DINHEIRO',
              amount: payment.amount,
              details: {
                employeeId: payment.employeeId,
                employeeName: employee?.name,
                position: employee?.position,
                observations: payment.observations,
                receipt: payment.receipt
              }
            });
          }
        });

        // PIX fees in period
        pixFees.forEach(fee => {
          if (fee.date >= startDate && fee.date <= endDate) {
            paidValues.push({
              id: `pix-fee-${fee.id}`,
              date: fee.date,
              type: 'Tarifa PIX',
              description: `Tarifa PIX - ${fee.bank}`,
              paymentMethod: 'PIX',
              amount: fee.amount,
              details: {
                bank: fee.bank,
                transactionType: fee.transactionType,
                description: fee.description,
                relatedTransactionId: fee.relatedTransactionId
              }
            });
          }
        });

        // Calculate totals
        const totalSales = periodSales.reduce((sum, sale) => sum + sale.totalValue, 0);
        const totalReceived = receivedValues.reduce((sum, item) => sum + item.amount, 0);
        const totalDebts = periodDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
        const totalPaid = paidValues.reduce((sum, item) => sum + item.amount, 0);

        const finalReportData = {
          sales: periodSales,
          receivedValues: receivedValues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          debts: periodDebts,
          paidValues: paidValues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          totals: {
            sales: totalSales,
            received: totalReceived,
            debts: totalDebts,
            paid: totalPaid,
            cashBalance: cashBalance?.currentBalance || 0
          }
        };

        setReportData(finalReportData);
        setLoading(false);

        // Auto print if requested
        if (auto) {
          setTimeout(() => {
            window.print();
          }, 1000);
        }
      } catch (error) {
        console.error('Error generating report data:', error);
        setLoading(false);
      }
    };

    generateReportData();
  }, [startDate, endDate, sales, debts, checks, boletos, employees, employeePayments, pixFees, cashBalance, auto, loadAllData]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p style={{ fontSize: '18px', fontWeight: '600', color: '#64748b' }}>
          Gerando relatório detalhado...
        </p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column'
      }}>
        <p style={{ fontSize: '18px', fontWeight: '600', color: '#ef4444' }}>
          Erro ao gerar dados do relatório
        </p>
      </div>
    );
  }

  return (
    <PrintableReport 
      data={reportData}
      filters={{
        startDate,
        endDate,
        categories,
        methods,
        status
      }}
      user={user}
    />
  );
}