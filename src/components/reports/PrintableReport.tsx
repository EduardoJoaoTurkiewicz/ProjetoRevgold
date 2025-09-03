import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  FileText, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Building2,
  CreditCard,
  Receipt,
  PieChart,
  BarChart3,
  Activity
} from 'lucide-react';
import { fmtBRL, fmtDate, fmtDateTime, nowBR, formatNumber } from '../../utils/format';
import '../../styles/print.css';

interface PrintableReportProps {
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
}

export function PrintableReport({ data, filters, user }: PrintableReportProps) {
  // Calculate additional metrics
  const metrics = useMemo(() => {
    const netResult = data.totals.received - data.totals.paid;
    const periodDays = Math.ceil(
      (new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    
    // Group by categories
    const categoryTotals = {};
    [...data.receivedValues, ...data.paidValues].forEach(item => {
      const category = item.type || 'Outros';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { entrada: 0, saida: 0 };
      }
      
      if (data.receivedValues.includes(item)) {
        categoryTotals[category].entrada += item.amount;
      } else {
        categoryTotals[category].saida += item.amount;
      }
    });
    
    // Group by payment methods
    const methodTotals = {};
    [...data.receivedValues, ...data.paidValues].forEach(item => {
      const method = item.paymentMethod || 'Não especificado';
      if (!methodTotals[method]) {
        methodTotals[method] = 0;
      }
      methodTotals[method] += item.amount;
    });
    
    // Group by date for daily breakdown
    const dailyTotals = {};
    [...data.receivedValues, ...data.paidValues].forEach(item => {
      const date = item.date;
      if (!dailyTotals[date]) {
        dailyTotals[date] = { entrada: 0, saida: 0 };
      }
      
      if (data.receivedValues.includes(item)) {
        dailyTotals[date].entrada += item.amount;
      } else {
        dailyTotals[date].saida += item.amount;
      }
    });
    
    return {
      netResult,
      periodDays,
      categoryTotals: Object.entries(categoryTotals)
        .map(([name, values]: [string, any]) => ({
          name,
          entrada: values.entrada,
          saida: values.saida,
          total: values.entrada - values.saida
        }))
        .sort((a, b) => Math.abs(b.total) - Math.abs(a.total)),
      methodTotals: Object.entries(methodTotals)
        .map(([name, value]: [string, any]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      dailyTotals: Object.entries(dailyTotals)
        .map(([date, values]: [string, any]) => ({
          date,
          entrada: values.entrada,
          saida: values.saida,
          saldo: values.entrada - values.saida
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };
  }, [data, filters]);

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'dinheiro': return 'payment-dinheiro';
      case 'pix': return 'payment-pix';
      case 'cartao_credito':
      case 'cartão de crédito': 
      case 'cartao_debito':
      case 'cartão de débito': return 'payment-cartao';
      case 'cheque': 
      case 'cheque próprio': return 'payment-cheque';
      case 'boleto': return 'payment-boleto';
      default: return 'payment-badge';
    }
  };

  return (
    <div style={{ padding: '0', margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
      {/* CAPA */}
      <div className="print-card company-header avoid-break-inside">
        <div>
          <h1 className="report-title">Relatório Financeiro RevGold</h1>
          <p className="report-subtitle">
            Período: {fmtDate(filters.startDate)} até {fmtDate(filters.endDate)}
          </p>
          <div className="subtle" style={{ marginTop: '12px' }}>
            <div>Gerado em: {nowBR()}</div>
            {user && <div>Usuário: {user}</div>}
            <div>Período: {metrics.periodDays} dias</div>
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

      {/* FILTROS APLICADOS */}
      <div className="filter-summary avoid-break-inside">
        <h3 style={{ margin: '0 0 12px 0', fontWeight: '700', color: '#334155' }}>Filtros Aplicados</h3>
        <div>
          <span className="filter-item">Período: {fmtDate(filters.startDate)} - {fmtDate(filters.endDate)}</span>
          {filters.categories && filters.categories.length > 0 && (
            <span className="filter-item">Categorias: {filters.categories.join(', ')}</span>
          )}
          {filters.methods && filters.methods.length > 0 && (
            <span className="filter-item">Métodos: {filters.methods.join(', ')}</span>
          )}
          {filters.status && filters.status !== 'all' && (
            <span className="filter-item">Status: {filters.status}</span>
          )}
        </div>
      </div>

      {/* SUMÁRIO EXECUTIVO */}
      <div className="section-spacing avoid-break-inside">
        <h2 className="section-title">SUMÁRIO EXECUTIVO</h2>
        
        <div className="print-grid-4">
          <div className="metric-card">
            <div className="metric-label">Vendas Realizadas</div>
            <div className="metric-value metric-green">{fmtBRL(data.totals.sales)}</div>
            <div className="subtle">{data.sales.length} venda(s)</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Valores Recebidos</div>
            <div className="metric-value metric-green">{fmtBRL(data.totals.received)}</div>
            <div className="subtle">{data.receivedValues.length} recebimento(s)</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Dívidas Feitas</div>
            <div className="metric-value metric-red">{fmtBRL(data.totals.debts)}</div>
            <div className="subtle">{data.debts.length} dívida(s)</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Valores Pagos</div>
            <div className="metric-value metric-red">{fmtBRL(data.totals.paid)}</div>
            <div className="subtle">{data.paidValues.length} pagamento(s)</div>
          </div>
        </div>

        <div className="print-grid-2" style={{ marginTop: '20px' }}>
          <div className="metric-card bg-green-light">
            <div className="metric-label">Resultado Líquido</div>
            <div className={`metric-value ${metrics.netResult >= 0 ? 'metric-green' : 'metric-red'}`}>
              {metrics.netResult >= 0 ? '+' : ''}{fmtBRL(metrics.netResult)}
            </div>
            <div className="subtle">Recebido - Pago</div>
          </div>
          
          <div className="metric-card bg-blue-light">
            <div className="metric-label">Saldo Final do Caixa</div>
            <div className="metric-value metric-blue">{fmtBRL(data.totals.cashBalance)}</div>
            <div className="subtle">Em {fmtDate(filters.endDate)}</div>
          </div>
        </div>
      </div>

      {/* TOP 5 CATEGORIAS */}
      <div className="section-spacing avoid-break-inside">
        <h2 className="section-title">TOP 5 CATEGORIAS</h2>
        
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th style={{ textAlign: 'right' }}>Entradas</th>
              <th style={{ textAlign: 'right' }}>Saídas</th>
              <th style={{ textAlign: 'right' }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {metrics.categoryTotals.slice(0, 5).map((category, index) => (
              <tr key={category.name}>
                <td style={{ fontWeight: '600' }}>{category.name}</td>
                <td style={{ textAlign: 'right' }} className="text-green">
                  {fmtBRL(category.entrada)}
                </td>
                <td style={{ textAlign: 'right' }} className="text-red">
                  {fmtBRL(category.saida)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '700' }} 
                    className={category.total >= 0 ? 'text-green' : 'text-red'}>
                  {category.total >= 0 ? '+' : ''}{fmtBRL(category.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOP 5 MÉTODOS DE PAGAMENTO */}
      <div className="section-spacing avoid-break-inside">
        <h2 className="section-title">TOP 5 MÉTODOS DE PAGAMENTO</h2>
        
        <table>
          <thead>
            <tr>
              <th>Método de Pagamento</th>
              <th style={{ textAlign: 'right' }}>Valor Total</th>
              <th style={{ textAlign: 'right' }}>% do Total</th>
            </tr>
          </thead>
          <tbody>
            {metrics.methodTotals.slice(0, 5).map((method, index) => {
              const percentage = (method.value / (data.totals.received + data.totals.paid)) * 100;
              return (
                <tr key={method.name}>
                  <td>
                    <span className={`payment-badge ${getPaymentMethodColor(method.name)}`}>
                      {method.name}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>
                    {fmtBRL(method.value)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {formatNumber(percentage, 1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* EVOLUÇÃO DIÁRIA */}
      <div className="section-spacing">
        <h2 className="section-title">EVOLUÇÃO DIÁRIA</h2>
        
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th style={{ textAlign: 'right' }}>Entradas</th>
              <th style={{ textAlign: 'right' }}>Saídas</th>
              <th style={{ textAlign: 'right' }}>Saldo do Dia</th>
            </tr>
          </thead>
          <tbody>
            {metrics.dailyTotals.map((day) => (
              <tr key={day.date}>
                <td style={{ fontWeight: '600' }}>{fmtDate(day.date)}</td>
                <td style={{ textAlign: 'right' }} className="text-green">
                  {fmtBRL(day.entrada)}
                </td>
                <td style={{ textAlign: 'right' }} className="text-red">
                  {fmtBRL(day.saida)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '700' }} 
                    className={day.saldo >= 0 ? 'text-green' : 'text-red'}>
                  {day.saldo >= 0 ? '+' : ''}{fmtBRL(day.saldo)}
                </td>
              </tr>
            ))}
            <tr className="total-row">
              <td style={{ fontWeight: '800' }}>TOTAL DO PERÍODO</td>
              <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-green">
                {fmtBRL(data.totals.received)}
              </td>
              <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-red">
                {fmtBRL(data.totals.paid)}
              </td>
              <td style={{ textAlign: 'right', fontWeight: '800' }} 
                  className={metrics.netResult >= 0 ? 'text-green' : 'text-red'}>
                {metrics.netResult >= 0 ? '+' : ''}{fmtBRL(metrics.netResult)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* VENDAS REALIZADAS */}
      {data.sales.length > 0 && (
        <div className="section-spacing">
          <h2 className="section-title">1. VENDAS REALIZADAS</h2>
          
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Produtos</th>
                <th>Vendedor</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th style={{ textAlign: 'right' }}>Recebido</th>
                <th style={{ textAlign: 'right' }}>Pendente</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.sales.map((sale) => (
                <tr key={sale.id} className="avoid-break-inside">
                  <td>{fmtDate(sale.date)}</td>
                  <td style={{ fontWeight: '600' }}>{sale.client}</td>
                  <td style={{ maxWidth: '200px', fontSize: '11px' }}>
                    {typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}
                  </td>
                  <td style={{ fontSize: '11px' }}>
                    {sale.sellerId ? 'Vendedor' : 'Sem vendedor'}
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
                    <span className={`status-badge ${
                      sale.status === 'pago' ? 'status-paid' :
                      sale.status === 'parcial' ? 'status-partial' :
                      'status-pending'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="subtotal-row">
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: '700' }}>
                  TOTAL DE VENDAS:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }}>
                  {fmtBRL(data.totals.sales)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-green">
                  {fmtBRL(data.sales.reduce((sum, s) => sum + s.receivedAmount, 0))}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-orange">
                  {fmtBRL(data.sales.reduce((sum, s) => sum + s.pendingAmount, 0))}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* VALORES RECEBIDOS */}
      {data.receivedValues.length > 0 && (
        <div className="section-spacing">
          <h2 className="section-title">2. VALORES RECEBIDOS</h2>
          
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Cliente</th>
                <th>Método</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {data.receivedValues.map((item) => (
                <tr key={item.id} className="avoid-break-inside">
                  <td>{fmtDate(item.date)}</td>
                  <td>
                    <span className={`status-badge ${
                      item.type === 'Venda' ? 'status-paid' :
                      item.type === 'Cheque' ? 'payment-cheque' :
                      'payment-boleto'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ maxWidth: '250px', fontSize: '11px' }}>
                    {item.description}
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    {item.details?.client || item.details?.company || '—'}
                  </td>
                  <td>
                    <span className={`payment-badge ${getPaymentMethodColor(item.paymentMethod)}`}>
                      {item.paymentMethod}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }} className="text-green">
                    {fmtBRL(item.amount)}
                  </td>
                  <td style={{ fontSize: '10px', maxWidth: '150px' }}>
                    {item.details?.observations || 
                     item.details?.overdueAction || 
                     item.details?.installment || '—'}
                  </td>
                </tr>
              ))}
              <tr className="subtotal-row">
                <td colSpan={5} style={{ textAlign: 'right', fontWeight: '700' }}>
                  TOTAL RECEBIDO:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-green">
                  {fmtBRL(data.totals.received)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* DÍVIDAS FEITAS */}
      {data.debts.length > 0 && (
        <div className="section-spacing">
          <h2 className="section-title">3. DÍVIDAS FEITAS</h2>
          
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Empresa</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'right' }}>Valor Total</th>
                <th style={{ textAlign: 'right' }}>Pago</th>
                <th style={{ textAlign: 'right' }}>Pendente</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.debts.map((debt) => (
                <tr key={debt.id} className="avoid-break-inside">
                  <td>{fmtDate(debt.date)}</td>
                  <td style={{ fontWeight: '600' }}>{debt.company}</td>
                  <td style={{ maxWidth: '250px', fontSize: '11px' }}>
                    {debt.description}
                  </td>
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
              ))}
              <tr className="subtotal-row">
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: '700' }}>
                  TOTAL DE DÍVIDAS:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }}>
                  {fmtBRL(data.totals.debts)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-green">
                  {fmtBRL(data.debts.reduce((sum, d) => sum + d.paidAmount, 0))}
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-orange">
                  {fmtBRL(data.debts.reduce((sum, d) => sum + d.pendingAmount, 0))}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* VALORES PAGOS */}
      {data.paidValues.length > 0 && (
        <div className="section-spacing">
          <h2 className="section-title">4. VALORES PAGOS</h2>
          
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Empresa/Funcionário</th>
                <th>Método</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {data.paidValues.map((item) => (
                <tr key={item.id} className="avoid-break-inside">
                  <td>{fmtDate(item.date)}</td>
                  <td>
                    <span className={`status-badge ${
                      item.type === 'Dívida' ? 'status-pending' :
                      item.type === 'Salário' ? 'payment-cartao' :
                      item.type === 'Cheque Próprio' ? 'payment-cheque' :
                      'payment-pix'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ maxWidth: '250px', fontSize: '11px' }}>
                    {item.description}
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    {item.details?.company || 
                     item.details?.employeeName || 
                     item.details?.client || '—'}
                  </td>
                  <td>
                    <span className={`payment-badge ${getPaymentMethodColor(item.paymentMethod)}`}>
                      {item.paymentMethod}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }} className="text-red">
                    {fmtBRL(item.amount)}
                  </td>
                  <td style={{ fontSize: '10px', maxWidth: '150px' }}>
                    {item.details?.observations || 
                     item.details?.usedFor || 
                     item.details?.description || '—'}
                  </td>
                </tr>
              ))}
              <tr className="subtotal-row">
                <td colSpan={5} style={{ textAlign: 'right', fontWeight: '700' }}>
                  TOTAL PAGO:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }} className="text-red">
                  {fmtBRL(data.totals.paid)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* RESUMO FINAL */}
      <div className="section-spacing page-break">
        <h2 className="section-title">RESUMO FINAL DO PERÍODO</h2>
        
        <div className="print-card bg-blue-light">
          <div className="print-grid-2">
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontWeight: '700', color: '#1e40af' }}>
                Movimentação Financeira
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Vendas Realizadas:</span>
                  <span style={{ fontWeight: '700' }}>{fmtBRL(data.totals.sales)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valores Recebidos:</span>
                  <span style={{ fontWeight: '700' }} className="text-green">
                    {fmtBRL(data.totals.received)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Dívidas Feitas:</span>
                  <span style={{ fontWeight: '700' }}>{fmtBRL(data.totals.debts)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valores Pagos:</span>
                  <span style={{ fontWeight: '700' }} className="text-red">
                    {fmtBRL(data.totals.paid)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontWeight: '700', color: '#1e40af' }}>
                Resultado do Período
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Resultado Líquido:</span>
                  <span style={{ fontWeight: '800', fontSize: '18px' }} 
                        className={metrics.netResult >= 0 ? 'text-green' : 'text-red'}>
                    {metrics.netResult >= 0 ? '+' : ''}{fmtBRL(metrics.netResult)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Saldo Final do Caixa:</span>
                  <span style={{ fontWeight: '800', fontSize: '18px' }} className="text-blue">
                    {fmtBRL(data.totals.cashBalance)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Período Analisado:</span>
                  <span style={{ fontWeight: '700' }}>{metrics.periodDays} dias</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total de Transações:</span>
                  <span style={{ fontWeight: '700' }}>
                    {data.receivedValues.length + data.paidValues.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="report-footer">
        <div>Sistema RevGold - Gestão Empresarial Profissional</div>
        <div>Relatório gerado em {nowBR()}</div>
        <div>Este documento contém informações confidenciais da empresa</div>
      </div>
    </div>
  );
}