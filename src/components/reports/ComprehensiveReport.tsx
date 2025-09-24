import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  FileText, 
  Receipt,
  CreditCard,
  Building2,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';
import { fmtBRL, fmtDate, fmtDateTime, nowBR } from '../../utils/format';
import '../../styles/print.css';

interface ComprehensiveReportProps {
  data: {
    sales: any[];
    receivedValues: any[];
    debts: any[];
    paidValues: any[];
    totals: {
      sales: number;
      received: number;
      debts: number;
      paid: number;
      cashBalance: number;
    };
  };
  filters: {
    startDate: string;
    endDate: string;
    categories?: string[];
    methods?: string[];
    status?: string;
  };
  user?: string;
  checks: any[];
  boletos: any[];
  allSales: any[];
  allDebts: any[];
}

export function ComprehensiveReport({ 
  data, 
  filters, 
  user, 
  checks, 
  boletos, 
  allSales, 
  allDebts 
}: ComprehensiveReportProps) {
  // Calcular dados abrangentes
  const comprehensiveData = useMemo(() => {
    // 1. VENDAS DO PERÍODO COM DETALHES COMPLETOS
    const periodSales = allSales.filter(sale => 
      sale.date >= filters.startDate && sale.date <= filters.endDate
    );

    // 2. DÍVIDAS DO PERÍODO COM DETALHES COMPLETOS
    const periodDebts = allDebts.filter(debt => 
      debt.date >= filters.startDate && debt.date <= filters.endDate
    );

    // 3. VALORES RECEBIDOS NO PERÍODO (detalhado)
    const receivedInPeriod = [];
    
    // Vendas com pagamento instantâneo
    periodSales.forEach(sale => {
      (sale.paymentMethods || []).forEach((method, methodIndex) => {
        if (['dinheiro', 'pix', 'cartao_debito'].includes(method.type) || 
            (method.type === 'cartao_credito' && (!method.installments || method.installments === 1))) {
          receivedInPeriod.push({
            id: `sale-instant-${sale.id}-${methodIndex}`,
            date: sale.date,
            type: 'Venda Instantânea',
            description: `Venda - ${sale.client}`,
            client: sale.client,
            paymentMethod: method.type.replace('_', ' ').toUpperCase(),
            amount: method.amount,
            saleId: sale.id,
            details: {
              products: sale.products,
              totalSaleValue: sale.totalValue,
              seller: sale.sellerId,
              observations: sale.observations
            }
          });
        }
      });
    });
    
    // Cheques compensados no período
    checks.forEach(check => {
      if (check.dueDate >= filters.startDate && 
          check.dueDate <= filters.endDate && 
          check.status === 'compensado' &&
          !check.isOwnCheck && !check.isCompanyPayable) {
        receivedInPeriod.push({
          id: `check-received-${check.id}`,
          date: check.dueDate,
          type: 'Cheque Compensado',
          description: `Cheque compensado - ${check.client}`,
          client: check.client,
          paymentMethod: 'CHEQUE',
          amount: check.value,
          checkId: check.id,
          details: {
            installment: `${check.installmentNumber}/${check.totalInstallments}`,
            usedFor: check.usedFor,
            observations: check.observations
          }
        });
      }
    });
    
    // Boletos recebidos no período
    boletos.forEach(boleto => {
      if (boleto.dueDate >= filters.startDate && 
          boleto.dueDate <= filters.endDate && 
          boleto.status === 'compensado' &&
          !boleto.isCompanyPayable) {
        const netReceived = (boleto.finalAmount || boleto.value) - (boleto.notaryCosts || 0);
        receivedInPeriod.push({
          id: `boleto-received-${boleto.id}`,
          date: boleto.dueDate,
          type: 'Boleto Recebido',
          description: `Boleto recebido - ${boleto.client}`,
          client: boleto.client,
          paymentMethod: 'BOLETO',
          amount: netReceived,
          boletoId: boleto.id,
          details: {
            originalValue: boleto.value,
            finalAmount: boleto.finalAmount,
            notaryCosts: boleto.notaryCosts,
            installment: `${boleto.installmentNumber}/${boleto.totalInstallments}`,
            overdueAction: boleto.overdueAction,
            observations: boleto.observations
          }
        });
      }
    });

    // 4. VALORES PAGOS NO PERÍODO (detalhado)
    const paidInPeriod = [];
    
    // Dívidas pagas no período
    periodDebts.forEach(debt => {
      if (debt.isPaid) {
        (debt.paymentMethods || []).forEach((method, methodIndex) => {
          if (['dinheiro', 'pix', 'cartao_debito', 'transferencia'].includes(method.type)) {
            paidInPeriod.push({
              id: `debt-paid-${debt.id}-${methodIndex}`,
              date: debt.date,
              type: 'Dívida Paga',
              description: `Pagamento - ${debt.company}`,
              company: debt.company,
              paymentMethod: method.type.replace('_', ' ').toUpperCase(),
              amount: method.amount,
              debtId: debt.id,
              details: {
                description: debt.description,
                totalDebtValue: debt.totalValue,
                observations: debt.paymentDescription
              }
            });
          }
        });
      }
    });
    
    // Cheques próprios pagos no período
    checks.forEach(check => {
      if ((check.isOwnCheck || check.isCompanyPayable) && 
          check.dueDate >= filters.startDate && 
          check.dueDate <= filters.endDate && 
          check.status === 'compensado') {
        paidInPeriod.push({
          id: `check-paid-${check.id}`,
          date: check.dueDate,
          type: 'Cheque Próprio Pago',
          description: `Cheque próprio - ${check.client}`,
          company: check.companyName || check.client,
          paymentMethod: 'CHEQUE PRÓPRIO',
          amount: check.value,
          checkId: check.id,
          details: {
            installment: `${check.installmentNumber}/${check.totalInstallments}`,
            usedFor: check.usedFor,
            observations: check.observations
          }
        });
      }
    });
    
    // Boletos da empresa pagos no período
    boletos.forEach(boleto => {
      if (boleto.isCompanyPayable && 
          boleto.dueDate >= filters.startDate && 
          boleto.dueDate <= filters.endDate && 
          boleto.status === 'compensado') {
        paidInPeriod.push({
          id: `boleto-paid-${boleto.id}`,
          date: boleto.dueDate,
          type: 'Boleto Pago',
          description: `Boleto pago - ${boleto.client}`,
          company: boleto.companyName || boleto.client,
          paymentMethod: 'BOLETO',
          amount: boleto.value + (boleto.interestPaid || 0),
          boletoId: boleto.id,
          details: {
            originalValue: boleto.value,
            interestPaid: boleto.interestPaid,
            installment: `${boleto.installmentNumber}/${boleto.totalInstallments}`,
            observations: boleto.observations
          }
        });
      }
    });

    // 5. DÍVIDAS PENDENTES (TOTAL A PAGAR)
    const pendingDebts = allDebts.filter(debt => !debt.isPaid);
    
    // 6. VALORES A RECEBER (TOTAL)
    const valuesToReceive = [];
    
    // Cheques pendentes a receber
    checks.forEach(check => {
      if (check.status === 'pendente' && !check.isOwnCheck && !check.isCompanyPayable) {
        valuesToReceive.push({
          id: `pending-check-${check.id}`,
          type: 'Cheque a Receber',
          client: check.client,
          amount: check.value,
          dueDate: check.dueDate,
          details: {
            installment: `${check.installmentNumber}/${check.totalInstallments}`,
            usedFor: check.usedFor,
            observations: check.observations,
            saleId: check.saleId
          }
        });
      }
    });
    
    // Boletos pendentes a receber
    boletos.forEach(boleto => {
      if (boleto.status === 'pendente' && !boleto.isCompanyPayable) {
        valuesToReceive.push({
          id: `pending-boleto-${boleto.id}`,
          type: 'Boleto a Receber',
          client: boleto.client,
          amount: boleto.value,
          dueDate: boleto.dueDate,
          details: {
            installment: `${boleto.installmentNumber}/${boleto.totalInstallments}`,
            observations: boleto.observations,
            saleId: boleto.saleId
          }
        });
      }
    });
    
    // Vendas com valores pendentes
    allSales.forEach(sale => {
      if (sale.pendingAmount > 0) {
        valuesToReceive.push({
          id: `pending-sale-${sale.id}`,
          type: 'Venda Pendente',
          client: sale.client,
          amount: sale.pendingAmount,
          dueDate: sale.date,
          details: {
            products: sale.products,
            totalValue: sale.totalValue,
            receivedAmount: sale.receivedAmount,
            observations: sale.observations
          }
        });
      }
    });

    // Calcular totais
    const totalSalesPeriod = periodSales.reduce((sum, sale) => sum + sale.totalValue, 0);
    const totalDebtsPeriod = periodDebts.reduce((sum, debt) => sum + debt.totalValue, 0);
    const totalReceivedPeriod = receivedInPeriod.reduce((sum, item) => sum + item.amount, 0);
    const totalPaidPeriod = paidInPeriod.reduce((sum, item) => sum + item.amount, 0);
    const totalPendingDebts = pendingDebts.reduce((sum, debt) => sum + debt.pendingAmount, 0);
    const totalToReceive = valuesToReceive.reduce((sum, item) => sum + item.amount, 0);

    return {
      periodSales,
      periodDebts,
      receivedInPeriod: receivedInPeriod.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      paidInPeriod: paidInPeriod.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      pendingDebts,
      valuesToReceive: valuesToReceive.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      totals: {
        salesPeriod: totalSalesPeriod,
        debtsPeriod: totalDebtsPeriod,
        receivedPeriod: totalReceivedPeriod,
        paidPeriod: totalPaidPeriod,
        pendingDebts: totalPendingDebts,
        toReceive: totalToReceive,
        netResultPeriod: totalReceivedPeriod - totalPaidPeriod,
        netPositionTotal: totalToReceive - totalPendingDebts
      }
    };
  }, [allSales, allDebts, checks, boletos, filters]);

  // Função para obter cheques relacionados a uma venda/dívida
  const getRelatedChecks = (entityId: string, entityType: 'sale' | 'debt') => {
    return checks.filter(check => 
      entityType === 'sale' ? check.saleId === entityId : check.debtId === entityId
    );
  };

  // Função para obter boletos relacionados a uma venda/dívida
  const getRelatedBoletos = (entityId: string, entityType: 'sale' | 'debt') => {
    return boletos.filter(boleto => 
      entityType === 'sale' ? boleto.saleId === entityId : boleto.debtId === entityId
    );
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'dinheiro': return 'payment-dinheiro';
      case 'pix': return 'payment-pix';
      case 'cartao credito':
      case 'cartao debito': return 'payment-cartao';
      case 'cheque':
      case 'cheque proprio': return 'payment-cheque';
      case 'boleto': return 'payment-boleto';
      default: return 'payment-badge';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pago':
      case 'compensado': return 'status-paid';
      case 'parcial': return 'status-partial';
      case 'pendente': return 'status-pending';
      default: return 'status-badge';
    }
  };

  return (
    <div style={{ padding: '0', margin: '0', fontSize: '13px', lineHeight: '1.4' }}>
      {/* CAPA PRINCIPAL */}
      <div className="print-card company-header avoid-break-inside">
        <div>
          <h1 className="report-title">Relatório Financeiro Completo</h1>
          <h2 className="report-subtitle">Sistema RevGold - Gestão Empresarial</h2>
          <div className="subtle" style={{ marginTop: '16px', fontSize: '14px' }}>
            <div><strong>Período:</strong> {fmtDate(filters.startDate)} até {fmtDate(filters.endDate)}</div>
            <div><strong>Gerado em:</strong> {nowBR()}</div>
            {user && <div><strong>Usuário:</strong> {user}</div>}
            <div><strong>Dias analisados:</strong> {Math.ceil((new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} dias</div>
          </div>
        </div>
        <img 
          src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
          alt="RevGold Logo" 
          className="company-logo"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>

      {/* RESUMO EXECUTIVO EXPANDIDO */}
      <div className="section-spacing avoid-break-inside">
        <h2 className="section-title">📊 RESUMO EXECUTIVO</h2>
        
        <div className="print-grid-4">
          <div className="metric-card bg-green-light">
            <div className="metric-label">Vendas do Período</div>
            <div className="metric-value metric-green">{fmtBRL(comprehensiveData.totals.salesPeriod)}</div>
            <div className="subtle">{comprehensiveData.periodSales.length} venda(s)</div>
          </div>
          
          <div className="metric-card bg-blue-light">
            <div className="metric-label">Valores Recebidos</div>
            <div className="metric-value metric-green">{fmtBRL(comprehensiveData.totals.receivedPeriod)}</div>
            <div className="subtle">{comprehensiveData.receivedInPeriod.length} recebimento(s)</div>
          </div>
          
          <div className="metric-card bg-red-light">
            <div className="metric-label">Dívidas do Período</div>
            <div className="metric-value metric-red">{fmtBRL(comprehensiveData.totals.debtsPeriod)}</div>
            <div className="subtle">{comprehensiveData.periodDebts.length} dívida(s)</div>
          </div>
          
          <div className="metric-card bg-orange-light">
            <div className="metric-label">Valores Pagos</div>
            <div className="metric-value metric-red">{fmtBRL(comprehensiveData.totals.paidPeriod)}</div>
            <div className="subtle">{comprehensiveData.paidInPeriod.length} pagamento(s)</div>
          </div>
        </div>

        <div className="print-grid-2" style={{ marginTop: '20px' }}>
          <div className="metric-card bg-purple-light">
            <div className="metric-label">Resultado do Período</div>
            <div className={`metric-value ${comprehensiveData.totals.netResultPeriod >= 0 ? 'metric-green' : 'metric-red'}`}>
              {comprehensiveData.totals.netResultPeriod >= 0 ? '+' : ''}{fmtBRL(comprehensiveData.totals.netResultPeriod)}
            </div>
            <div className="subtle">Recebido - Pago no período</div>
          </div>
          
          <div className="metric-card bg-blue-light">
            <div className="metric-label">Saldo Atual do Caixa</div>
            <div className="metric-value metric-blue">{fmtBRL(data.totals.cashBalance)}</div>
            <div className="subtle">Posição em {fmtDate(filters.endDate)}</div>
          </div>
        </div>
      </div>

      {/* 1. VENDAS DO PERÍODO - DETALHADO */}
      <div className="section-spacing page-break">
        <h2 className="section-title">1. 📈 VENDAS REALIZADAS NO PERÍODO</h2>
        
        {comprehensiveData.periodSales.length > 0 ? (
          <>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Data</th>
                  <th style={{ width: '200px' }}>Cliente</th>
                  <th style={{ width: '250px' }}>Produtos</th>
                  <th style={{ width: '120px' }}>Vendedor</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Valor Total</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Recebido</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Pendente</th>
                  <th style={{ width: '80px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {comprehensiveData.periodSales.map((sale) => (
                  <React.Fragment key={sale.id}>
                    <tr className="avoid-break-inside">
                      <td style={{ fontWeight: '600' }}>{fmtDate(sale.date)}</td>
                      <td style={{ fontWeight: '700', color: '#1e293b' }}>{sale.client}</td>
                      <td style={{ fontSize: '11px', color: '#475569' }}>
                        {typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}
                      </td>
                      <td style={{ fontSize: '11px' }}>
                        {sale.sellerId ? 'Com vendedor' : 'Sem vendedor'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>
                        {fmtBRL(sale.totalValue)}
                      </td>
                      <td style={{ textAlign: 'right' }} className="text-green">
                        {fmtBRL(sale.receivedAmount)}
                      </td>
                      <td style={{ textAlign: 'right' }} className="text-orange">
                        {fmtBRL(sale.pendingAmount)}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusColor(sale.status)}`}>
                          {sale.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                    
                    {/* Métodos de Pagamento da Venda */}
                    <tr className="avoid-break-inside">
                      <td colSpan={8} style={{ padding: '8px 16px', background: '#f8fafc' }}>
                        <div style={{ fontSize: '11px' }}>
                          <strong style={{ color: '#334155' }}>Métodos de Pagamento:</strong>
                          <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {(sale.paymentMethods || []).map((method, idx) => (
                              <span key={idx} style={{ 
                                display: 'inline-block',
                                padding: '2px 8px',
                                background: '#e2e8f0',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                {method.type.replace('_', ' ').toUpperCase()}: {fmtBRL(method.amount)}
                                {method.installments && method.installments > 1 && (
                                  <span style={{ color: '#64748b' }}> ({method.installments}x)</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Cheques relacionados à venda */}
                    {(() => {
                      const relatedChecks = getRelatedChecks(sale.id, 'sale');
                      if (relatedChecks.length > 0) {
                        return (
                          <tr className="avoid-break-inside">
                            <td colSpan={8} style={{ padding: '8px 16px', background: '#fef3c7' }}>
                              <div style={{ fontSize: '11px' }}>
                                <strong style={{ color: '#92400e' }}>Cheques desta Venda ({relatedChecks.length}):</strong>
                                <div style={{ marginTop: '4px' }}>
                                  {relatedChecks.map((check, idx) => (
                                    <div key={check.id} style={{ 
                                      marginBottom: '4px',
                                      padding: '4px 8px',
                                      background: '#fffbeb',
                                      borderRadius: '4px',
                                      border: '1px solid #fde68a'
                                    }}>
                                      <strong>Cheque {idx + 1}:</strong> {fmtBRL(check.value)} - 
                                      Venc: {fmtDate(check.dueDate)} - 
                                      Status: <span className={`status-badge ${getStatusColor(check.status)}`} style={{ fontSize: '9px' }}>
                                        {check.status.toUpperCase()}
                                      </span>
                                      {check.installmentNumber && (
                                        <span> - Parcela {check.installmentNumber}/{check.totalInstallments}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })()}

                    {/* Boletos relacionados à venda */}
                    {(() => {
                      const relatedBoletos = getRelatedBoletos(sale.id, 'sale');
                      if (relatedBoletos.length > 0) {
                        return (
                          <tr className="avoid-break-inside">
                            <td colSpan={8} style={{ padding: '8px 16px', background: '#cffafe' }}>
                              <div style={{ fontSize: '11px' }}>
                                <strong style={{ color: '#0f766e' }}>Boletos desta Venda ({relatedBoletos.length}):</strong>
                                <div style={{ marginTop: '4px' }}>
                                  {relatedBoletos.map((boleto, idx) => (
                                    <div key={boleto.id} style={{ 
                                      marginBottom: '4px',
                                      padding: '4px 8px',
                                      background: '#f0fdfa',
                                      borderRadius: '4px',
                                      border: '1px solid #a7f3d0'
                                    }}>
                                      <strong>Boleto {idx + 1}:</strong> {fmtBRL(boleto.value)} - 
                                      Venc: {fmtDate(boleto.dueDate)} - 
                                      Status: <span className={`status-badge ${getStatusColor(boleto.status)}`} style={{ fontSize: '9px' }}>
                                        {boleto.status.toUpperCase()}
                                      </span>
                                      - Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                                      {boleto.finalAmount && boleto.finalAmount !== boleto.value && (
                                        <span style={{ color: '#059669' }}> - Valor Final: {fmtBRL(boleto.finalAmount)}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })()}
                  </React.Fragment>
                ))}
                
                <tr className="total-row">
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: '800' }}>
                    TOTAL DE VENDAS DO PERÍODO:
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '900' }}>
                    {fmtBRL(comprehensiveData.totals.salesPeriod)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-green">
                    {fmtBRL(comprehensiveData.periodSales.reduce((sum, s) => sum + s.receivedAmount, 0))}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-orange">
                    {fmtBRL(comprehensiveData.periodSales.reduce((sum, s) => sum + s.pendingAmount, 0))}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <div className="print-card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '16px', color: '#64748b' }}>Nenhuma venda realizada no período selecionado.</p>
          </div>
        )}
      </div>

      {/* 2. DÍVIDAS DO PERÍODO - DETALHADO */}
      <div className="section-spacing">
        <h2 className="section-title">2. 💳 DÍVIDAS FEITAS NO PERÍODO</h2>
        
        {comprehensiveData.periodDebts.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Data</th>
                <th style={{ width: '200px' }}>Empresa</th>
                <th style={{ width: '300px' }}>Descrição</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Valor Total</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Pago</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Pendente</th>
                <th style={{ width: '80px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {comprehensiveData.periodDebts.map((debt) => (
                <React.Fragment key={debt.id}>
                  <tr className="avoid-break-inside">
                    <td style={{ fontWeight: '600' }}>{fmtDate(debt.date)}</td>
                    <td style={{ fontWeight: '700', color: '#1e293b' }}>{debt.company}</td>
                    <td style={{ fontSize: '11px', color: '#475569' }}>{debt.description}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {fmtBRL(debt.totalValue)}
                    </td>
                    <td style={{ textAlign: 'right' }} className="text-green">
                      {fmtBRL(debt.paidAmount)}
                    </td>
                    <td style={{ textAlign: 'right' }} className="text-orange">
                      {fmtBRL(debt.pendingAmount)}
                    </td>
                    <td>
                      <span className={`status-badge ${debt.isPaid ? 'status-paid' : 'status-pending'}`}>
                        {debt.isPaid ? 'PAGO' : 'PENDENTE'}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Métodos de Pagamento da Dívida */}
                  <tr className="avoid-break-inside">
                    <td colSpan={7} style={{ padding: '8px 16px', background: '#fef2f2' }}>
                      <div style={{ fontSize: '11px' }}>
                        <strong style={{ color: '#991b1b' }}>Métodos de Pagamento:</strong>
                        <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {(debt.paymentMethods || []).map((method, idx) => (
                            <span key={idx} style={{ 
                              display: 'inline-block',
                              padding: '2px 8px',
                              background: '#fee2e2',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}>
                              {method.type.replace('_', ' ').toUpperCase()}: {fmtBRL(method.amount)}
                              {method.installments && method.installments > 1 && (
                                <span style={{ color: '#64748b' }}> ({method.installments}x)</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Cheques relacionados à dívida */}
                  {(() => {
                    const relatedChecks = getRelatedChecks(debt.id, 'debt');
                    if (relatedChecks.length > 0) {
                      return (
                        <tr className="avoid-break-inside">
                          <td colSpan={7} style={{ padding: '8px 16px', background: '#fef3c7' }}>
                            <div style={{ fontSize: '11px' }}>
                              <strong style={{ color: '#92400e' }}>Cheques desta Dívida ({relatedChecks.length}):</strong>
                              <div style={{ marginTop: '4px' }}>
                                {relatedChecks.map((check, idx) => (
                                  <div key={check.id} style={{ 
                                    marginBottom: '4px',
                                    padding: '4px 8px',
                                    background: '#fffbeb',
                                    borderRadius: '4px',
                                    border: '1px solid #fde68a'
                                  }}>
                                    <strong>Cheque {idx + 1}:</strong> {fmtBRL(check.value)} - 
                                    Venc: {fmtDate(check.dueDate)} - 
                                    Status: <span className={`status-badge ${getStatusColor(check.status)}`} style={{ fontSize: '9px' }}>
                                      {check.status.toUpperCase()}
                                    </span>
                                    {check.isOwnCheck && <span style={{ color: '#dc2626' }}> (PRÓPRIO)</span>}
                                    {check.installmentNumber && (
                                      <span> - Parcela {check.installmentNumber}/{check.totalInstallments}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return null;
                  })()}

                  {/* Boletos relacionados à dívida */}
                  {(() => {
                    const relatedBoletos = getRelatedBoletos(debt.id, 'debt');
                    if (relatedBoletos.length > 0) {
                      return (
                        <tr className="avoid-break-inside">
                          <td colSpan={7} style={{ padding: '8px 16px', background: '#cffafe' }}>
                            <div style={{ fontSize: '11px' }}>
                              <strong style={{ color: '#0f766e' }}>Boletos desta Dívida ({relatedBoletos.length}):</strong>
                              <div style={{ marginTop: '4px' }}>
                                {relatedBoletos.map((boleto, idx) => (
                                  <div key={boleto.id} style={{ 
                                    marginBottom: '4px',
                                    padding: '4px 8px',
                                    background: '#f0fdfa',
                                    borderRadius: '4px',
                                    border: '1px solid #a7f3d0'
                                  }}>
                                    <strong>Boleto {idx + 1}:</strong> {fmtBRL(boleto.value)} - 
                                    Venc: {fmtDate(boleto.dueDate)} - 
                                    Status: <span className={`status-badge ${getStatusColor(boleto.status)}`} style={{ fontSize: '9px' }}>
                                      {boleto.status.toUpperCase()}
                                    </span>
                                    - Parcela {boleto.installmentNumber}/{boleto.totalInstallments}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return null;
                  })()}
                </React.Fragment>
              ))}
              
              <tr className="total-row">
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: '800' }}>
                  TOTAL DE DÍVIDAS DO PERÍODO:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '900' }}>
                  {fmtBRL(comprehensiveData.totals.debtsPeriod)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-green">
                  {fmtBRL(comprehensiveData.periodDebts.reduce((sum, d) => sum + d.paidAmount, 0))}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-orange">
                  {fmtBRL(comprehensiveData.periodDebts.reduce((sum, d) => sum + d.pendingAmount, 0))}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="print-card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '16px', color: '#64748b' }}>Nenhuma dívida registrada no período selecionado.</p>
          </div>
        )}
      </div>

      {/* 3. VALORES RECEBIDOS NO PERÍODO */}
      <div className="section-spacing">
        <h2 className="section-title">3. 💰 VALORES RECEBIDOS NO PERÍODO</h2>
        
        {comprehensiveData.receivedInPeriod.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Data</th>
                <th style={{ width: '120px' }}>Tipo</th>
                <th style={{ width: '200px' }}>Cliente</th>
                <th style={{ width: '250px' }}>Descrição</th>
                <th style={{ width: '100px' }}>Método</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Valor</th>
                <th style={{ width: '150px' }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {comprehensiveData.receivedInPeriod.map((item) => (
                <tr key={item.id} className="avoid-break-inside">
                  <td style={{ fontWeight: '600' }}>{fmtDate(item.date)}</td>
                  <td>
                    <span className={`status-badge ${
                      item.type.includes('Venda') ? 'status-paid' :
                      item.type.includes('Cheque') ? 'payment-cheque' :
                      'payment-boleto'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: '#1e293b' }}>{item.client}</td>
                  <td style={{ fontSize: '11px', color: '#475569' }}>{item.description}</td>
                  <td>
                    <span className={`payment-badge ${getPaymentMethodColor(item.paymentMethod)}`}>
                      {item.paymentMethod}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }} className="text-green">
                    {fmtBRL(item.amount)}
                  </td>
                  <td style={{ fontSize: '10px', color: '#64748b' }}>
                    {item.details?.installment && <div>Parcela: {item.details.installment}</div>}
                    {item.details?.usedFor && <div>Usado em: {item.details.usedFor}</div>}
                    {item.details?.overdueAction && <div>Situação: {item.details.overdueAction.replace('_', ' ')}</div>}
                  </td>
                </tr>
              ))}
              
              <tr className="total-row">
                <td colSpan={5} style={{ textAlign: 'right', fontWeight: '800' }}>
                  TOTAL RECEBIDO NO PERÍODO:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '900' }} className="text-green">
                  {fmtBRL(comprehensiveData.totals.receivedPeriod)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="print-card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '16px', color: '#64748b' }}>Nenhum valor recebido no período selecionado.</p>
          </div>
        )}
      </div>

      {/* 4. VALORES PAGOS NO PERÍODO */}
      <div className="section-spacing">
        <h2 className="section-title">4. 💸 VALORES PAGOS NO PERÍODO</h2>
        
        {comprehensiveData.paidInPeriod.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Data</th>
                <th style={{ width: '120px' }}>Tipo</th>
                <th style={{ width: '200px' }}>Empresa/Funcionário</th>
                <th style={{ width: '250px' }}>Descrição</th>
                <th style={{ width: '100px' }}>Método</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Valor</th>
                <th style={{ width: '150px' }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {comprehensiveData.paidInPeriod.map((item) => (
                <tr key={item.id} className="avoid-break-inside">
                  <td style={{ fontWeight: '600' }}>{fmtDate(item.date)}</td>
                  <td>
                    <span className={`status-badge ${
                      item.type.includes('Dívida') ? 'status-pending' :
                      item.type.includes('Salário') ? 'payment-cartao' :
                      item.type.includes('Cheque') ? 'payment-cheque' :
                      'payment-pix'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: '#1e293b' }}>
                    {item.company || item.details?.employeeName || '—'}
                  </td>
                  <td style={{ fontSize: '11px', color: '#475569' }}>{item.description}</td>
                  <td>
                    <span className={`payment-badge ${getPaymentMethodColor(item.paymentMethod)}`}>
                      {item.paymentMethod}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }} className="text-red">
                    {fmtBRL(item.amount)}
                  </td>
                  <td style={{ fontSize: '10px', color: '#64748b' }}>
                    {item.details?.installment && <div>Parcela: {item.details.installment}</div>}
                    {item.details?.usedFor && <div>Usado em: {item.details.usedFor}</div>}
                    {item.details?.observations && <div>Obs: {item.details.observations}</div>}
                  </td>
                </tr>
              ))}
              
              <tr className="total-row">
                <td colSpan={5} style={{ textAlign: 'right', fontWeight: '800' }}>
                  TOTAL PAGO NO PERÍODO:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '900' }} className="text-red">
                  {fmtBRL(comprehensiveData.totals.paidPeriod)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="print-card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '16px', color: '#64748b' }}>Nenhum valor pago no período selecionado.</p>
          </div>
        )}
      </div>

      {/* 5. DÍVIDAS PENDENTES (TOTAL A PAGAR) */}
      <div className="section-spacing page-break">
        <h2 className="section-title">5. 🔴 DÍVIDAS PENDENTES (TOTAL A PAGAR)</h2>
        
        {comprehensiveData.pendingDebts.length > 0 ? (
          <>
            <div className="print-card bg-red-light" style={{ marginBottom: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>
                  TOTAL A PAGAR: {fmtBRL(comprehensiveData.totals.pendingDebts)}
                </h3>
                <p style={{ margin: '0', color: '#991b1b', fontSize: '14px', fontWeight: '600' }}>
                  {comprehensiveData.pendingDebts.length} dívida(s) pendente(s)
                </p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Data</th>
                  <th style={{ width: '200px' }}>Empresa</th>
                  <th style={{ width: '300px' }}>Descrição</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Valor Total</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Pendente</th>
                  <th style={{ width: '150px' }}>Forma de Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {comprehensiveData.pendingDebts.map((debt) => (
                  <React.Fragment key={debt.id}>
                    <tr className="avoid-break-inside">
                      <td style={{ fontWeight: '600' }}>{fmtDate(debt.date)}</td>
                      <td style={{ fontWeight: '700', color: '#dc2626' }}>{debt.company}</td>
                      <td style={{ fontSize: '11px', color: '#475569' }}>{debt.description}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>
                        {fmtBRL(debt.totalValue)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }} className="text-red">
                        {fmtBRL(debt.pendingAmount)}
                      </td>
                      <td style={{ fontSize: '11px' }}>
                        {(debt.paymentMethods || []).map((method, idx) => (
                          <div key={idx} style={{ marginBottom: '2px' }}>
                            <span className={`payment-badge ${getPaymentMethodColor(method.type)}`} style={{ fontSize: '9px' }}>
                              {method.type.replace('_', ' ').toUpperCase()}
                            </span>
                            : {fmtBRL(method.amount)}
                          </div>
                        ))}
                      </td>
                    </tr>

                    {/* Cheques pendentes desta dívida */}
                    {(() => {
                      const relatedChecks = getRelatedChecks(debt.id, 'debt').filter(c => c.status === 'pendente');
                      if (relatedChecks.length > 0) {
                        return (
                          <tr className="avoid-break-inside">
                            <td colSpan={6} style={{ padding: '8px 16px', background: '#fef3c7' }}>
                              <div style={{ fontSize: '10px' }}>
                                <strong style={{ color: '#92400e' }}>⏳ Cheques Pendentes ({relatedChecks.length}):</strong>
                                {relatedChecks.map((check, idx) => (
                                  <div key={check.id} style={{ 
                                    marginTop: '4px',
                                    padding: '4px 8px',
                                    background: '#fffbeb',
                                    borderRadius: '4px',
                                    border: '1px solid #fde68a'
                                  }}>
                                    Cheque {idx + 1}: {fmtBRL(check.value)} - Venc: {fmtDate(check.dueDate)}
                                    {check.isOwnCheck && <span style={{ color: '#dc2626', fontWeight: '700' }}> (PRÓPRIO)</span>}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })()}

                    {/* Boletos pendentes desta dívida */}
                    {(() => {
                      const relatedBoletos = getRelatedBoletos(debt.id, 'debt').filter(b => b.status === 'pendente');
                      if (relatedBoletos.length > 0) {
                        return (
                          <tr className="avoid-break-inside">
                            <td colSpan={6} style={{ padding: '8px 16px', background: '#cffafe' }}>
                              <div style={{ fontSize: '10px' }}>
                                <strong style={{ color: '#0f766e' }}>⏳ Boletos Pendentes ({relatedBoletos.length}):</strong>
                                {relatedBoletos.map((boleto, idx) => (
                                  <div key={boleto.id} style={{ 
                                    marginTop: '4px',
                                    padding: '4px 8px',
                                    background: '#f0fdfa',
                                    borderRadius: '4px',
                                    border: '1px solid #a7f3d0'
                                  }}>
                                    Boleto {idx + 1}: {fmtBRL(boleto.value)} - Venc: {fmtDate(boleto.dueDate)}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })()}
                  </React.Fragment>
                ))}
                
                <tr className="total-row">
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: '800' }}>
                    TOTAL DE DÍVIDAS PENDENTES:
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '900' }} className="text-red">
                    {fmtBRL(comprehensiveData.totals.pendingDebts)}
                  </td>
                  <td></td>
                </tr>
            </tbody>
          </table>
        ) : (
          <div className="print-card bg-green-light" style={{ textAlign: 'center', padding: '40px' }}>
            <h3 style={{ color: '#059669', fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0' }}>
              ✅ EXCELENTE! Nenhuma dívida pendente!
            </h3>
            <p style={{ fontSize: '14px', color: '#047857', margin: '0' }}>
              Todas as dívidas estão quitadas.
            </p>
          </div>
        )}
      </div>

      {/* 6. VALORES A RECEBER (TOTAL) */}
      <div className="section-spacing">
        <h2 className="section-title">6. 🟢 VALORES A RECEBER (TOTAL)</h2>
        
        {comprehensiveData.valuesToReceive.length > 0 ? (
          <>
            <div className="print-card bg-green-light" style={{ marginBottom: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: '#059669' }}>
                  TOTAL A RECEBER: {fmtBRL(comprehensiveData.totals.toReceive)}
                </h3>
                <p style={{ margin: '0', color: '#047857', fontSize: '14px', fontWeight: '600' }}>
                  {comprehensiveData.valuesToReceive.length} item(s) a receber
                </p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Vencimento</th>
                  <th style={{ width: '120px' }}>Tipo</th>
                  <th style={{ width: '200px' }}>Cliente</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Valor</th>
                  <th style={{ width: '80px' }}>Status</th>
                  <th style={{ width: '200px' }}>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {comprehensiveData.valuesToReceive.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="avoid-break-inside">
                      <td style={{ fontWeight: '600' }}>
                        {fmtDate(item.dueDate)}
                        {new Date(item.dueDate) < new Date() && (
                          <div style={{ fontSize: '9px', color: '#dc2626', fontWeight: '700' }}>VENCIDO</div>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${
                          item.type.includes('Cheque') ? 'payment-cheque' :
                          item.type.includes('Boleto') ? 'payment-boleto' :
                          'status-pending'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: '#1e293b' }}>{item.client}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }} className="text-green">
                        {fmtBRL(item.amount)}
                      </td>
                      <td>
                        <span className={`status-badge ${
                          new Date(item.dueDate) < new Date() ? 'status-pending' : 'status-partial'
                        }`}>
                          {new Date(item.dueDate) < new Date() ? 'VENCIDO' : 'PENDENTE'}
                        </span>
                      </td>
                      <td style={{ fontSize: '10px', color: '#64748b' }}>
                        {item.details?.installment && <div>Parcela: {item.details.installment}</div>}
                        {item.details?.products && <div>Produtos: {typeof item.details.products === 'string' ? item.details.products : 'Produtos vendidos'}</div>}
                        {item.details?.observations && <div>Obs: {item.details.observations}</div>}
                      </td>
                    </tr>

                    {/* Detalhes de cheques relacionados */}
                    {item.type === 'Cheque a Receber' && item.details?.saleId && (() => {
                      const saleChecks = getRelatedChecks(item.details.saleId, 'sale');
                      if (saleChecks.length > 1) {
                        return (
                          <tr className="avoid-break-inside">
                            <td colSpan={6} style={{ padding: '8px 16px', background: '#fef3c7' }}>
                              <div style={{ fontSize: '10px' }}>
                                <strong style={{ color: '#92400e' }}>Todos os Cheques desta Venda:</strong>
                                {saleChecks.map((check, idx) => (
                                  <div key={check.id} style={{ 
                                    marginTop: '2px',
                                    padding: '2px 6px',
                                    background: check.status === 'compensado' ? '#dcfce7' : '#fffbeb',
                                    borderRadius: '4px',
                                    border: `1px solid ${check.status === 'compensado' ? '#bbf7d0' : '#fde68a'}`
                                  }}>
                                    Cheque {idx + 1}: {fmtBRL(check.value)} - Venc: {fmtDate(check.dueDate)} - 
                                    <span style={{ 
                                      fontWeight: '700',
                                      color: check.status === 'compensado' ? '#059669' : '#d97706'
                                    }}>
                                      {check.status.toUpperCase()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })()}

                    {/* Detalhes de boletos relacionados */}
                    {item.type === 'Boleto a Receber' && item.details?.saleId && (() => {
                      const saleBoletos = getRelatedBoletos(item.details.saleId, 'sale');
                      if (saleBoletos.length > 1) {
                        return (
                          <tr className="avoid-break-inside">
                            <td colSpan={6} style={{ padding: '8px 16px', background: '#cffafe' }}>
                              <div style={{ fontSize: '10px' }}>
                                <strong style={{ color: '#0f766e' }}>Todos os Boletos desta Venda:</strong>
                                {saleBoletos.map((boleto, idx) => (
                                  <div key={boleto.id} style={{ 
                                    marginTop: '2px',
                                    padding: '2px 6px',
                                    background: boleto.status === 'compensado' ? '#dcfce7' : '#f0fdfa',
                                    borderRadius: '4px',
                                    border: `1px solid ${boleto.status === 'compensado' ? '#bbf7d0' : '#a7f3d0'}`
                                  }}>
                                    Boleto {idx + 1}: {fmtBRL(boleto.value)} - Venc: {fmtDate(boleto.dueDate)} - 
                                    <span style={{ 
                                      fontWeight: '700',
                                      color: boleto.status === 'compensado' ? '#059669' : '#0891b2'
                                    }}>
                                      {boleto.status.toUpperCase()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })()}
                  </React.Fragment>
                ))}
                
                <tr className="total-row">
                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: '800' }}>
                    TOTAL A RECEBER:
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '900' }} className="text-green">
                    {fmtBRL(comprehensiveData.totals.toReceive)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <div className="print-card bg-green-light" style={{ textAlign: 'center', padding: '40px' }}>
            <h3 style={{ color: '#059669', fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0' }}>
              ✅ EXCELENTE! Nada a receber!
            </h3>
            <p style={{ fontSize: '14px', color: '#047857', margin: '0' }}>
              Todos os valores já foram recebidos.
            </p>
          </div>
        )}
      </div>

      {/* POSIÇÃO FINANCEIRA CONSOLIDADA */}
      <div className="section-spacing page-break">
        <h2 className="section-title">📋 POSIÇÃO FINANCEIRA CONSOLIDADA</h2>
        
        <div className="print-card bg-blue-light">
          <div className="print-grid-2">
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontWeight: '700', color: '#1e40af', fontSize: '18px' }}>
                Movimentação do Período
              </h3>
              <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: '600' }}>Vendas Realizadas:</span>
                  <span style={{ fontWeight: '700' }}>{fmtBRL(comprehensiveData.totals.salesPeriod)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: '600' }}>Valores Recebidos:</span>
                  <span style={{ fontWeight: '700' }} className="text-green">
                    {fmtBRL(comprehensiveData.totals.receivedPeriod)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: '600' }}>Dívidas Feitas:</span>
                  <span style={{ fontWeight: '700' }}>{fmtBRL(comprehensiveData.totals.debtsPeriod)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #3b82f6' }}>
                  <span style={{ fontWeight: '600' }}>Valores Pagos:</span>
                  <span style={{ fontWeight: '700' }} className="text-red">
                    {fmtBRL(comprehensiveData.totals.paidPeriod)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                  <span style={{ fontWeight: '800', fontSize: '16px' }}>Resultado do Período:</span>
                  <span style={{ fontWeight: '900', fontSize: '18px' }} 
                        className={comprehensiveData.totals.netResultPeriod >= 0 ? 'text-green' : 'text-red'}>
                    {comprehensiveData.totals.netResultPeriod >= 0 ? '+' : ''}{fmtBRL(comprehensiveData.totals.netResultPeriod)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontWeight: '700', color: '#1e40af', fontSize: '18px' }}>
                Posição Financeira Total
              </h3>
              <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: '600' }}>Total a Receber:</span>
                  <span style={{ fontWeight: '700' }} className="text-green">
                    {fmtBRL(comprehensiveData.totals.toReceive)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: '600' }}>Total a Pagar:</span>
                  <span style={{ fontWeight: '700' }} className="text-red">
                    {fmtBRL(comprehensiveData.totals.pendingDebts)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #3b82f6' }}>
                  <span style={{ fontWeight: '600' }}>Saldo do Caixa:</span>
                  <span style={{ fontWeight: '700' }} className="text-blue">
                    {fmtBRL(data.totals.cashBalance)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                  <span style={{ fontWeight: '800', fontSize: '16px' }}>Posição Líquida:</span>
                  <span style={{ fontWeight: '900', fontSize: '18px' }} 
                        className={comprehensiveData.totals.netPositionTotal >= 0 ? 'text-green' : 'text-red'}>
                    {comprehensiveData.totals.netPositionTotal >= 0 ? '+' : ''}{fmtBRL(comprehensiveData.totals.netPositionTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ANÁLISE DE PERFORMANCE */}
      <div className="section-spacing">
        <h2 className="section-title">📈 ANÁLISE DE PERFORMANCE</h2>
        
        <div className="print-grid-3">
          <div className="metric-card">
            <div className="metric-label">Eficiência de Recebimento</div>
            <div className="metric-value metric-blue">
              {comprehensiveData.totals.salesPeriod > 0 
                ? ((comprehensiveData.totals.receivedPeriod / comprehensiveData.totals.salesPeriod) * 100).toFixed(1)
                : '0'}%
            </div>
            <div className="subtle">Recebido vs Vendido</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Ticket Médio</div>
            <div className="metric-value metric-purple">
              {comprehensiveData.periodSales.length > 0 
                ? fmtBRL(comprehensiveData.totals.salesPeriod / comprehensiveData.periodSales.length)
                : fmtBRL(0)}
            </div>
            <div className="subtle">Por venda</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Gasto Médio</div>
            <div className="metric-value metric-orange">
              {comprehensiveData.periodDebts.length > 0 
                ? fmtBRL(comprehensiveData.totals.debtsPeriod / comprehensiveData.periodDebts.length)
                : fmtBRL(0)}
            </div>
            <div className="subtle">Por dívida</div>
          </div>
        </div>
      </div>

      {/* RODAPÉ PROFISSIONAL */}
      <div className="report-footer" style={{ marginTop: '60px' }}>
        <div style={{ borderTop: '3px solid #3b82f6', paddingTop: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <strong style={{ fontSize: '16px', color: '#1e293b' }}>Sistema RevGold - Gestão Empresarial Profissional</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', fontSize: '12px', color: '#64748b' }}>
            <div style={{ textAlign: 'left' }}>
              <div><strong>Relatório Gerado:</strong></div>
              <div>{nowBR()}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div><strong>Período Analisado:</strong></div>
              <div>{fmtDate(filters.startDate)} - {fmtDate(filters.endDate)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div><strong>Documento:</strong></div>
              <div>Confidencial</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#94a3b8' }}>
            Este documento contém informações confidenciais da empresa e deve ser tratado com sigilo.
          </div>
        </div>
      </div>
    </div>
  );
}