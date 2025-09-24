import React, { useMemo } from 'react';
import { fmtBRL, fmtDate, fmtDateTime, nowBR, formatNumber } from '../../utils/format';
import { ComprehensiveReport } from './ComprehensiveReport';
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
  // This component now uses the new ComprehensiveReport
  // We need to pass additional data that wasn't available before
  return (
    <div>
      <p style={{ 
        textAlign: 'center', 
        padding: '40px', 
        fontSize: '18px', 
        color: '#64748b',
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        margin: '20px'
      }}>
        ⚠️ Este componente foi substituído pelo novo sistema de relatório abrangente.<br/>
        Por favor, use o componente ComprehensiveReport diretamente.
      </p>
    </div>
  );
}