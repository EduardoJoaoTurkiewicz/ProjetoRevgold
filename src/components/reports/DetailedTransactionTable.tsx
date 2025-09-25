import React, { useMemo } from 'react';
import { fmtBRL, fmtDate } from '../../utils/format';

interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  paymentMethod: string;
  amount: number;
  details: any;
}

interface DetailedTransactionTableProps {
  receivedValues: Transaction[];
  paidValues: Transaction[];
}

export function DetailedTransactionTable({ receivedValues, paidValues }: DetailedTransactionTableProps) {
  const groupedTransactions = useMemo(() => {
    // Combine all transactions
    const allTransactions = [
      ...(receivedValues || []).filter(t => t && typeof t === 'object').map(t => ({ ...t, transactionType: 'entrada' })),
      ...(paidValues || []).filter(t => t && typeof t === 'object').map(t => ({ ...t, transactionType: 'saida' }))
    ];

    // Group by date
    const byDate: Record<string, any[]> = {};
    allTransactions.forEach(transaction => {
      if (!transaction || !transaction.date) return;
      
      const date = transaction.date;
      if (!byDate[date]) {
        byDate[date] = [];
      }
      byDate[date].push(transaction);
    });

    // Sort dates and transactions within each date
    const sortedDates = Object.keys(byDate).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    return sortedDates.map(date => ({
      date,
      transactions: byDate[date].sort((a, b) => {
        // Sort by type (entrada first), then by amount (desc)
        if (a.transactionType !== b.transactionType) {
          return a.transactionType === 'entrada' ? -1 : 1;
        }
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }),
      dailyTotals: {
        entrada: byDate[date]
          .filter(t => t.transactionType === 'entrada')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
        saida: byDate[date]
          .filter(t => t.transactionType === 'saida')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      }
    }));
  }, [receivedValues, paidValues]);

  const getTransactionIcon = (type: string, transactionType: string) => {
    if (transactionType === 'entrada') {
      return '↗️';
    } else {
      return '↙️';
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const cleanMethod = method.toLowerCase().replace(/[^a-z]/g, '');
    switch (cleanMethod) {
      case 'dinheiro': return 'payment-dinheiro';
      case 'pix': return 'payment-pix';
      case 'cartaocredito':
      case 'cartaodebito': return 'payment-cartao';
      case 'cheque':
      case 'chequeproprio': return 'payment-cheque';
      case 'boleto': return 'payment-boleto';
      default: return 'payment-badge';
    }
  };

  const grandTotals = useMemo(() => {
    const totalEntrada = (receivedValues || []).reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
    const totalSaida = (paidValues || []).reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
    return {
      entrada: totalEntrada,
      saida: totalSaida,
      saldo: totalEntrada - totalSaida
    };
  }, [receivedValues, paidValues]);

  return (
    <div className="section-spacing">
      <h2 className="section-title">TRANSAÇÕES DETALHADAS</h2>
      
      <table>
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Data</th>
            <th style={{ width: '60px' }}>Tipo</th>
            <th style={{ width: '300px' }}>Descrição</th>
            <th style={{ width: '150px' }}>Cliente/Empresa</th>
            <th style={{ width: '100px' }}>Método</th>
            <th style={{ width: '120px', textAlign: 'right' }}>Valor</th>
            <th style={{ width: '200px' }}>Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {groupedTransactions.map(({ date, transactions, dailyTotals }) => (
            <React.Fragment key={date}>
              {/* Date header */}
              <tr className="avoid-break-inside">
                <td colSpan={7} style={{ 
                  fontWeight: '800', 
                  fontSize: '14px',
                  paddingTop: '16px',
                  paddingBottom: '8px',
                  background: 'linear-gradient(to right, #f1f5f9, #e2e8f0) !important',
                  color: '#1e293b'
                }}>
                  📅 {fmtDate(date)} - {transactions.length} transação(ões)
                </td>
              </tr>
              
              {/* Transactions for this date */}
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="avoid-break-inside">
                  <td style={{ fontSize: '11px', color: '#64748b' }}>
                    {fmtDate(transaction.date)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '14px' }}>
                        {getTransactionIcon(transaction.type, transaction.transactionType)}
                      </span>
                      <span className={`status-badge ${
                        transaction.transactionType === 'entrada' ? 'status-paid' : 'status-pending'
                      }`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {transaction.transactionType === 'entrada' ? 'ENT' : 'SAÍ'}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', fontWeight: '600' }}>
                    <div>{transaction.description}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      {transaction.type}
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', fontWeight: '600' }}>
                    {transaction.details?.client || 
                     transaction.details?.company || 
                     transaction.details?.employeeName || '—'}
                  </td>
                  <td>
                    <span className={`payment-badge ${getPaymentMethodBadge(transaction.paymentMethod)}`}>
                      {transaction.paymentMethod}
                    </span>
                  </td>
                  <td style={{ 
                    textAlign: 'right', 
                    fontWeight: '700',
                    fontSize: '13px'
                  }} className={transaction.transactionType === 'entrada' ? 'text-green' : 'text-red'}>
                    {transaction.transactionType === 'entrada' ? '+' : '-'}{fmtBRL(Number(transaction.amount) || 0)}
                  </td>
                  <td style={{ fontSize: '10px', color: '#64748b' }}>
                    {transaction.details?.installment && (
                      <div>Parcela: {transaction.details.installment}</div>
                    )}
                    {transaction.details?.usedFor && (
                      <div>Usado em: {transaction.details.usedFor}</div>
                    )}
                    {transaction.details?.observations && (
                      <div>Obs: {transaction.details.observations}</div>
                    )}
                    {transaction.details?.overdueAction && (
                      <div>Situação: {transaction.details.overdueAction.replace('_', ' ')}</div>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Daily subtotal */}
              <tr className="subtotal-row avoid-break-after">
                <td colSpan={5} style={{ textAlign: 'right', fontWeight: '700' }}>
                  Subtotal de {fmtDate(date)}:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800' }}>
                  <div className="text-green">+{fmtBRL(dailyTotals.entrada)}</div>
                  <div className="text-red">-{fmtBRL(dailyTotals.saida)}</div>
                  <div className={dailyTotals.entrada - dailyTotals.saida >= 0 ? 'text-green' : 'text-red'} 
                       style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', marginTop: '4px' }}>
                    {dailyTotals.entrada - dailyTotals.saida >= 0 ? '+' : ''}
                    {fmtBRL(dailyTotals.entrada - dailyTotals.saida)}
                  </div>
                </td>
                <td></td>
              </tr>
            </React.Fragment>
          ))}
          
          {/* Grand total */}
          <tr className="total-row">
            <td colSpan={5} style={{ textAlign: 'right', fontWeight: '800', fontSize: '14px' }}>
              TOTAL GERAL DO PERÍODO:
            </td>
            <td style={{ textAlign: 'right', fontWeight: '900', fontSize: '14px' }}>
              <div className="text-green">+{fmtBRL(grandTotals.entrada)}</div>
              <div className="text-red">-{fmtBRL(grandTotals.saida)}</div>
              <div className={grandTotals.saldo >= 0 ? 'text-green' : 'text-red'} 
                   style={{ 
                     borderTop: '2px solid #3b82f6', 
                     paddingTop: '6px', 
                     marginTop: '6px',
                     fontSize: '16px',
                     fontWeight: '900'
                   }}>
                {grandTotals.saldo >= 0 ? '+' : ''}{fmtBRL(grandTotals.saldo)}
              </div>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}