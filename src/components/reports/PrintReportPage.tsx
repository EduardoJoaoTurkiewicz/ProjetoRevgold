import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PrintableReport } from './PrintableReport';
import { useAppContext } from '../../context/AppContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [error, setError] = useState<string | null>(null);

  // Get filters from URL params
  const startDate = searchParams.get('startDate') || (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const endDate = searchParams.get('endDate') || (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const methods = searchParams.get('methods')?.split(',').filter(Boolean) || [];
  const status = searchParams.get('status') || 'all';
  const reportType = searchParams.get('reportType') || 'comprehensive';
  const auto = searchParams.get('auto') === '1';
  const user = searchParams.get('user') || 'Sistema';

  useEffect(() => {
    const generateReportData = async () => {
      setError(null);
      setLoading(true);
      
      try {
        console.log('🔄 Generating report data for period:', { startDate, endDate });
        
        // Ensure all data is loaded with timeout
        const loadTimeout = setTimeout(() => {
          throw new Error('Timeout loading data - please try again');
        }, 15000);
        
        try {
          await loadAllData();
          clearTimeout(loadTimeout);
        } catch (loadError) {
          clearTimeout(loadTimeout);
          throw loadError;
        }
        
        // Validate data arrays
        if (!Array.isArray(sales)) {
          throw new Error('Sales data is not available');
        }
        if (!Array.isArray(debts)) {
          throw new Error('Debts data is not available');
        }
        if (!Array.isArray(checks)) {
          throw new Error('Checks data is not available');
        }
        if (!Array.isArray(boletos)) {
          throw new Error('Boletos data is not available');
        }
        if (!Array.isArray(employees)) {
          throw new Error('Employees data is not available');
        }
        if (!Array.isArray(employeePayments)) {
          throw new Error('Employee payments data is not available');
        }
        if (!Array.isArray(pixFees)) {
          throw new Error('PIX fees data is not available');
        }
        
        // Filter data by period (same logic as Reports component)
        const periodSales = sales.filter(sale => 
          sale.date >= startDate && sale.date <= endDate
        );

        // Calculate received values
        const receivedValues = [];
        
        // Sales with instant payment
        periodSales.forEach(sale => {
          if (!sale.paymentMethods || !Array.isArray(sale.paymentMethods)) {
            return; // Skip sales without valid payment methods
          }
          
          (sale.paymentMethods || []).forEach((method, methodIndex) => {
            if (!method || typeof method !== 'object') {
              return; // Skip invalid payment methods
            }
            
            if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
                (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
              receivedValues.push({
                id: `sale-${sale.id}-${methodIndex}`,
                date: sale.date,
                type: 'Venda',
                description: `Venda - ${sale.client}`,
                paymentMethod: method.type.replace('_', ' ').toUpperCase(),
                amount: Number(method.amount) || 0,
                details: {
                  saleId: sale.id,
                  client: sale.client,
                  products: sale.products,
                  totalSaleValue: Number(sale.totalValue) || 0,
                  seller: sale.sellerId ? employees.find(e => e.id === sale.sellerId)?.name : 'N/A'
                }
              });
            }
          });
        });

        // Checks compensated in period
        checks.forEach(check => {
          if (!check || typeof check !== 'object') {
            return; // Skip invalid checks
          }
          
          if (check.dueDate >= startDate && check.dueDate <= endDate && check.status === 'compensado') {
            receivedValues.push({
              id: `check-${check.id}`,
              date: check.dueDate,
              type: 'Cheque',
              description: `Cheque compensado - ${check.client}`,
              paymentMethod: 'CHEQUE',
              amount: Number(check.value) || 0,
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
          if (!boleto || typeof boleto !== 'object') {
            return; // Skip invalid boletos
          }
          
          if (boleto.dueDate >= startDate && boleto.dueDate <= endDate && boleto.status === 'compensado') {
            const finalAmount = Number(boleto.finalAmount) || Number(boleto.value) || 0;
            const notaryCosts = Number(boleto.notaryCosts) || 0;
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
                originalValue: Number(boleto.value) || 0,
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
          if (!debt || typeof debt !== 'object') {
            return; // Skip invalid debts
          }
          
          if (debt.isPaid) {
            if (!debt.paymentMethods || !Array.isArray(debt.paymentMethods)) {
              return; // Skip debts without valid payment methods
            }
            
            (debt.paymentMethods || []).forEach((method, methodIndex) => {
              if (!method || typeof method !== 'object') {
                return; // Skip invalid payment methods
              }
              
              if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
                paidValues.push({
                  id: `debt-${debt.id}-${methodIndex}`,
                  date: debt.date,
                  type: 'Dívida',
                  description: `Pagamento - ${debt.company}`,
                  paymentMethod: method.type.replace('_', ' ').toUpperCase(),
                  amount: Number(method.amount) || 0,
                  details: {
                    debtId: debt.id,
                    company: debt.company,
                    description: debt.description,
                    totalDebtValue: Number(debt.totalValue) || 0,
                    paidAmount: Number(debt.paidAmount) || 0,
                    pendingAmount: Number(debt.pendingAmount) || 0
                  }
                });
              }
            });
          }
        });

        // Own checks paid in period
        checks.forEach(check => {
          if (!check || typeof check !== 'object') {
            return; // Skip invalid checks
          }
          
          if (check.isOwnCheck && check.dueDate >= startDate && check.dueDate <= endDate && check.status === 'compensado') {
            paidValues.push({
              id: `own-check-${check.id}`,
              date: check.dueDate,
              type: 'Cheque Próprio',
              description: `Cheque próprio pago - ${check.client}`,
              paymentMethod: 'CHEQUE PRÓPRIO',
              amount: Number(check.value) || 0,
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
          if (!payment || typeof payment !== 'object') {
            return; // Skip invalid payments
          }
          
          if (payment.paymentDate >= startDate && payment.paymentDate <= endDate) {
            const employee = employees.find(e => e.id === payment.employeeId);
            paidValues.push({
              id: `employee-payment-${payment.id}`,
              date: payment.paymentDate,
              type: 'Salário',
              description: `Pagamento de salário - ${employee?.name || 'Funcionário'}`,
              paymentMethod: 'DINHEIRO',
              amount: Number(payment.amount) || 0,
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
          if (!fee || typeof fee !== 'object') {
            return; // Skip invalid fees
          }
          
          if (fee.date >= startDate && fee.date <= endDate) {
            paidValues.push({
              id: `pix-fee-${fee.id}`,
              date: fee.date,
              type: 'Tarifa PIX',
              description: `Tarifa PIX - ${fee.bank}`,
              paymentMethod: 'PIX',
              amount: Number(fee.amount) || 0,
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
        const totalSales = periodSales.reduce((sum, sale) => sum + (Number(sale.totalValue) || 0), 0);
        const totalReceived = receivedValues.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const totalDebts = periodDebts.reduce((sum, debt) => sum + (Number(debt.totalValue) || 0), 0);
        const totalPaid = paidValues.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

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
            cashBalance: Number(cashBalance?.currentBalance) || 0
          }
        };

        console.log('✅ Report data generated successfully:', {
          salesCount: periodSales.length,
          receivedCount: receivedValues.length,
          debtsCount: periodDebts.length,
          paidCount: paidValues.length,
          totals: finalReportData.totals
        });
        
        setReportData(finalReportData);

        // Auto print if requested
        if (auto) {
          setTimeout(() => {
            try {
              window.print();
              toast.success('Relatório enviado para impressão');
            } catch (printError) {
              console.error('Error auto-printing:', printError);
              toast.error('Erro na impressão automática');
            }
          }, 2000); // Increased delay to ensure content is fully loaded
        }
      } catch (error) {
        console.error('Error generating report data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setError(errorMessage);
        toast.error('Erro ao gerar relatório: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    generateReportData();
  }, [startDate, endDate, sales, debts, checks, boletos, employees, employeePayments, pixFees, cashBalance, auto, loadAllData]);

  // Add error boundary for the print page
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Print page error:', event.error);
      setError('Erro ao carregar página de impressão: ' + event.error?.message);
      setLoading(false);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

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
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>
          Período: {startDate} até {endDate}
        </p>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
          Aguarde enquanto os dados são processados...
        </p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px'
      }}>
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '12px', 
          padding: '20px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
            Erro ao gerar dados do relatório
          </p>
          {error && (
            <p style={{ fontSize: '14px', color: '#7f1d1d' }}>
              {error}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Tentar Novamente
          </button>
        </div>
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
        status,
        reportType
      }}
      user={user}
    />
  );
}