import jsPDF from 'jspdf';

interface ReportData {
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
}

export async function exportReportToPDF(data: ReportData, startDate: string, endDate: string) {
  try {
    console.log('🔄 Iniciando geração do PDF...');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurações
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    let currentY = margin;

    // Função para verificar quebra de página
    const checkPageBreak = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin - 10) {
        pdf.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Função para adicionar texto com quebra de linha
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const fontSize = options.fontSize || 10;
      const maxWidth = options.maxWidth || contentWidth;
      const fontStyle = options.fontStyle || 'normal';
      
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      
      if (options.color) {
        if (Array.isArray(options.color)) {
          pdf.setTextColor(...options.color);
        } else {
          pdf.setTextColor(0, 0, 0);
        }
      }
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      
      return y + (lines.length * fontSize * 0.4);
    };

    // Header do PDF com design moderno
    pdf.setFillColor(22, 163, 74); // Verde RevGold
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('RevGold', margin, 20);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sistema de Gestão Empresarial', margin, 28);
    
    currentY = 50;

    // Título do relatório
    pdf.setFillColor(59, 130, 246); // Azul
    pdf.rect(margin, currentY, contentWidth, 15, 'F');
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('RELATÓRIO FINANCEIRO DETALHADO', margin + 5, currentY + 10);
    
    currentY += 25;

    // Informações do período
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    currentY = addText(
      `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`,
      margin, currentY
    );
    currentY = addText(
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      margin, currentY + 3
    );

    currentY += 15;

    // RESUMO EXECUTIVO
    checkPageBreak(80);
    
    pdf.setFillColor(16, 185, 129); // Verde claro
    pdf.rect(margin, currentY, contentWidth, 12, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('RESUMO EXECUTIVO', margin + 5, currentY + 8);
    
    currentY += 20;

    // Grid de resumo com design melhorado
    const summaryItems = [
      { label: 'Vendas Realizadas', value: data.totals.sales, count: data.sales.length, color: [22, 163, 74] },
      { label: 'Valores Recebidos', value: data.totals.received, count: data.receivedValues.length, color: [5, 150, 105] },
      { label: 'Dívidas Feitas', value: data.totals.debts, count: data.debts.length, color: [220, 38, 38] },
      { label: 'Valores Pagos', value: data.totals.paid, count: data.paidValues.length, color: [234, 88, 12] }
    ];

    summaryItems.forEach((item, index) => {
      const x = margin + (index % 2) * (contentWidth / 2);
      const y = currentY + Math.floor(index / 2) * 25;
      
      // Box colorido
      pdf.setFillColor(...item.color);
      pdf.rect(x, y, contentWidth / 2 - 5, 20, 'F');
      
      // Texto branco
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.label, x + 3, y + 6);
      
      pdf.setFontSize(14);
      pdf.text(`R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, x + 3, y + 12);
      
      pdf.setFontSize(10);
      pdf.text(`${item.count} registro(s)`, x + 3, y + 17);
    });

    currentY += 60;

    // Resultado Líquido com destaque
    checkPageBreak(30);
    
    const netResult = data.totals.received - data.totals.paid;
    const resultColor = netResult >= 0 ? [22, 163, 74] : [220, 38, 38];
    
    pdf.setFillColor(...resultColor);
    pdf.rect(margin, currentY, contentWidth, 25, 'F');
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('RESULTADO LÍQUIDO DO PERÍODO', margin + 5, currentY + 10);
    pdf.setFontSize(22);
    pdf.text(
      `${netResult >= 0 ? '+' : ''}R$ ${netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      margin + 5, currentY + 20
    );

    currentY += 35;

    // Saldo do Caixa
    checkPageBreak(25);
    
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, currentY, contentWidth, 20, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('SALDO ATUAL DO CAIXA', margin + 5, currentY + 8);
    pdf.setFontSize(18);
    pdf.text(
      `R$ ${data.totals.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      margin + 5, currentY + 16
    );

    currentY += 30;

    // SEÇÃO 1: VENDAS DETALHADAS
    if (data.sales.length > 0) {
      checkPageBreak(40);
      
      pdf.setFillColor(22, 163, 74);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`1. VENDAS REALIZADAS (${data.sales.length} venda(s))`, margin + 5, currentY + 8);
      
      currentY += 20;
      
      data.sales.forEach((sale, index) => {
        checkPageBreak(60);
        
        // Header da venda
        pdf.setFillColor(240, 253, 244);
        pdf.rect(margin, currentY, contentWidth, 8, 'F');
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(22, 163, 74);
        pdf.text(`${index + 1}. ${sale.client}`, margin + 3, currentY + 6);
        
        currentY += 12;
        
        // Informações básicas
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        const basicInfo = [
          `Data: ${new Date(sale.date).toLocaleDateString('pt-BR')}`,
          sale.deliveryDate ? `Entrega: ${new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}` : null,
          sale.sellerId ? `Vendedor: ${data.employees?.find(e => e.id === sale.sellerId)?.name || 'N/A'}` : null
        ].filter(Boolean);
        
        basicInfo.forEach(info => {
          currentY = addText(info, margin + 5, currentY + 3);
        });
        
        // Produtos
        currentY = addText(`Produtos: ${typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}`, 
          margin + 5, currentY + 3, { maxWidth: contentWidth - 10 });
        
        // Valores
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(22, 163, 74);
        currentY = addText(`Valor Total: R$ ${sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
          margin + 5, currentY + 5);
        
        // Formas de pagamento detalhadas
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        currentY = addText('Formas de Pagamento:', margin + 5, currentY + 5);
        
        (sale.paymentMethods || []).forEach((method, methodIndex) => {
          pdf.setFont('helvetica', 'normal');
          currentY = addText(
            `• ${method.type.replace('_', ' ').toUpperCase()}: R$ ${method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            margin + 8, currentY + 3
          );
          
          if (method.installments && method.installments > 1) {
            currentY = addText(
              `  Parcelado: ${method.installments}x de R$ ${(method.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              margin + 12, currentY + 3, { color: [100, 100, 100] }
            );
            
            if (method.installmentInterval) {
              currentY = addText(
                `  Intervalo: ${method.installmentInterval} dias`,
                margin + 12, currentY + 3, { color: [100, 100, 100] }
              );
            }
          }
          
          // Detalhes específicos por tipo de pagamento
          if (method.type === 'cheque' && method.thirdPartyDetails && method.thirdPartyDetails.length > 0) {
            currentY = addText('  Cheques de Terceiros:', margin + 12, currentY + 3, { fontStyle: 'bold' });
            method.thirdPartyDetails.forEach((checkDetail, checkIndex) => {
              currentY = addText(
                `    ${checkIndex + 1}. ${checkDetail.issuer} - Banco: ${checkDetail.bank}`,
                margin + 15, currentY + 3, { fontSize: 9, color: [100, 100, 100] }
              );
              currentY = addText(
                `       Ag: ${checkDetail.agency} Conta: ${checkDetail.account} Cheque: ${checkDetail.checkNumber}`,
                margin + 15, currentY + 3, { fontSize: 9, color: [100, 100, 100] }
              );
            });
          }
        });
        
        // Status e observações
        pdf.setFont('helvetica', 'bold');
        const statusColor = sale.status === 'pago' ? [22, 163, 74] : 
                           sale.status === 'parcial' ? [234, 179, 8] : [220, 38, 38];
        pdf.setTextColor(...statusColor);
        currentY = addText(`Status: ${sale.status.toUpperCase()}`, margin + 5, currentY + 5);
        
        if (sale.observations) {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          currentY = addText(`Observações: ${sale.observations}`, margin + 5, currentY + 3, 
            { maxWidth: contentWidth - 10, fontSize: 9 });
        }
        
        currentY += 8;
      });
      
      // Total de vendas
      checkPageBreak(20);
      pdf.setFillColor(34, 197, 94);
      pdf.rect(margin, currentY, contentWidth, 15, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL DE VENDAS: R$ ${data.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 10
      );
      
      currentY += 25;
    }

    // SEÇÃO 2: VALORES RECEBIDOS DETALHADOS
    if (data.receivedValues.length > 0) {
      checkPageBreak(40);
      
      pdf.setFillColor(5, 150, 105);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`2. VALORES RECEBIDOS (${data.receivedValues.length} recebimento(s))`, margin + 5, currentY + 8);
      
      currentY += 20;
      
      data.receivedValues.forEach((item, index) => {
        checkPageBreak(40);
        
        // Header do recebimento
        pdf.setFillColor(236, 253, 245);
        pdf.rect(margin, currentY, contentWidth, 8, 'F');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(5, 150, 105);
        pdf.text(`${index + 1}. ${item.description}`, margin + 3, currentY + 6);
        
        currentY += 12;
        
        // Detalhes do recebimento
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        currentY = addText(`Tipo: ${item.type} | Método: ${item.paymentMethod}`, margin + 5, currentY + 3);
        currentY = addText(`Data: ${new Date(item.date).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 3);
        
        // Valor em destaque
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(5, 150, 105);
        currentY = addText(`Valor: R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
          margin + 5, currentY + 3, { fontSize: 12 });
        
        // Detalhes específicos por tipo
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        if (item.type === 'Venda' && item.details) {
          currentY = addText(`Cliente: ${item.details.client}`, margin + 8, currentY + 3);
          if (item.details.seller && item.details.seller !== 'N/A') {
            currentY = addText(`Vendedor: ${item.details.seller}`, margin + 8, currentY + 3);
          }
          currentY = addText(`Produtos: ${item.details.products}`, margin + 8, currentY + 3, 
            { maxWidth: contentWidth - 16 });
        } else if (item.type === 'Cheque' && item.details) {
          currentY = addText(`Cliente: ${item.details.client}`, margin + 8, currentY + 3);
          currentY = addText(`Parcela: ${item.details.installment}`, margin + 8, currentY + 3);
          if (item.details.usedFor) {
            currentY = addText(`Usado para: ${item.details.usedFor}`, margin + 8, currentY + 3);
          }
        } else if (item.type === 'Boleto' && item.details) {
          currentY = addText(`Cliente: ${item.details.client}`, margin + 8, currentY + 3);
          currentY = addText(`Parcela: ${item.details.installment}`, margin + 8, currentY + 3);
          if (item.details.overdueAction) {
            currentY = addText(`Situação: ${item.details.overdueAction.replace('_', ' ')}`, margin + 8, currentY + 3);
          }
          if (item.details.notaryCosts > 0) {
            currentY = addText(`Custos de cartório: R$ ${item.details.notaryCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
              margin + 8, currentY + 3, { color: [220, 38, 38] });
          }
        }
        
        currentY += 8;
      });
      
      // Total recebido
      checkPageBreak(20);
      pdf.setFillColor(16, 185, 129);
      pdf.rect(margin, currentY, contentWidth, 15, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL RECEBIDO: R$ ${data.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 10
      );
      
      currentY += 25;
    }

    // SEÇÃO 3: DÍVIDAS DETALHADAS
    if (data.debts.length > 0) {
      checkPageBreak(40);
      
      pdf.setFillColor(220, 38, 38);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`3. DÍVIDAS FEITAS (${data.debts.length} dívida(s))`, margin + 5, currentY + 8);
      
      currentY += 20;
      
      data.debts.forEach((debt, index) => {
        checkPageBreak(50);
        
        // Header da dívida
        pdf.setFillColor(254, 242, 242);
        pdf.rect(margin, currentY, contentWidth, 8, 'F');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(220, 38, 38);
        pdf.text(`${index + 1}. ${debt.company}`, margin + 3, currentY + 6);
        
        currentY += 12;
        
        // Detalhes da dívida
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        currentY = addText(`Descrição: ${debt.description}`, margin + 5, currentY + 3, 
          { maxWidth: contentWidth - 10 });
        currentY = addText(`Data: ${new Date(debt.date).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 3);
        currentY = addText(`Status: ${debt.isPaid ? 'PAGO' : 'PENDENTE'}`, margin + 5, currentY + 3);
        
        // Valor em destaque
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(220, 38, 38);
        currentY = addText(`Valor Total: R$ ${debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
          margin + 5, currentY + 3, { fontSize: 12 });
        
        // Métodos de pagamento
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        currentY = addText('Formas de Pagamento:', margin + 5, currentY + 5);
        
        (debt.paymentMethods || []).forEach(method => {
          pdf.setFont('helvetica', 'normal');
          currentY = addText(
            `• ${method.type.replace('_', ' ').toUpperCase()}: R$ ${method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            margin + 8, currentY + 3
          );
          
          if (method.installments && method.installments > 1) {
            currentY = addText(
              `  ${method.installments}x de R$ ${(method.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              margin + 12, currentY + 3, { color: [100, 100, 100] }
            );
          }
        });
        
        // Observações adicionais
        if (debt.paymentDescription || debt.debtPaymentDescription) {
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 100, 100);
          if (debt.paymentDescription) {
            currentY = addText(`Pagamento: ${debt.paymentDescription}`, margin + 5, currentY + 3, 
              { maxWidth: contentWidth - 10, fontSize: 9 });
          }
          if (debt.debtPaymentDescription) {
            currentY = addText(`Dívida: ${debt.debtPaymentDescription}`, margin + 5, currentY + 3, 
              { maxWidth: contentWidth - 10, fontSize: 9 });
          }
        }
        
        currentY += 8;
      });
      
      // Total de dívidas
      checkPageBreak(20);
      pdf.setFillColor(239, 68, 68);
      pdf.rect(margin, currentY, contentWidth, 15, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL DE DÍVIDAS: R$ ${data.totals.debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 10
      );
      
      currentY += 25;
    }

    // SEÇÃO 4: VALORES PAGOS DETALHADOS
    if (data.paidValues.length > 0) {
      checkPageBreak(40);
      
      pdf.setFillColor(234, 88, 12);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`4. VALORES PAGOS (${data.paidValues.length} pagamento(s))`, margin + 5, currentY + 8);
      
      currentY += 20;
      
      data.paidValues.forEach((item, index) => {
        checkPageBreak(35);
        
        // Header do pagamento
        pdf.setFillColor(255, 247, 237);
        pdf.rect(margin, currentY, contentWidth, 8, 'F');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(234, 88, 12);
        pdf.text(`${index + 1}. ${item.description}`, margin + 3, currentY + 6);
        
        currentY += 12;
        
        // Detalhes do pagamento
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        currentY = addText(`Tipo: ${item.type} | Método: ${item.paymentMethod}`, margin + 5, currentY + 3);
        currentY = addText(`Data: ${new Date(item.date).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 3);
        
        // Valor em destaque
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(234, 88, 12);
        currentY = addText(`Valor: R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
          margin + 5, currentY + 3, { fontSize: 12 });
        
        // Detalhes específicos por tipo
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        if (item.type === 'Dívida' && item.details) {
          currentY = addText(`Empresa: ${item.details.company}`, margin + 8, currentY + 3);
          currentY = addText(`Descrição: ${item.details.description}`, margin + 8, currentY + 3, 
            { maxWidth: contentWidth - 16 });
        } else if (item.type === 'Salário' && item.details) {
          currentY = addText(`Funcionário: ${item.details.employeeName}`, margin + 8, currentY + 3);
          currentY = addText(`Cargo: ${item.details.position}`, margin + 8, currentY + 3);
          if (item.details.observations) {
            currentY = addText(`Observações: ${item.details.observations}`, margin + 8, currentY + 3, 
              { maxWidth: contentWidth - 16, fontSize: 9 });
          }
        } else if (item.type === 'Tarifa PIX' && item.details) {
          currentY = addText(`Banco: ${item.details.bank}`, margin + 8, currentY + 3);
          currentY = addText(`Tipo: ${item.details.transactionType.replace('_', ' ').toUpperCase()}`, margin + 8, currentY + 3);
          currentY = addText(`Descrição: ${item.details.description}`, margin + 8, currentY + 3, 
            { maxWidth: contentWidth - 16 });
        }
        
        currentY += 8;
      });
      
      // Total pago
      checkPageBreak(20);
      pdf.setFillColor(251, 146, 60);
      pdf.rect(margin, currentY, contentWidth, 15, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL PAGO: R$ ${data.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 10
      );
      
      currentY += 25;
    }

    // RESUMO FINAL DESTACADO
    checkPageBreak(60);
    
    pdf.setFillColor(30, 41, 59); // Azul escuro
    pdf.rect(margin, currentY, contentWidth, 50, 'F');
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('RESUMO FINAL DO PERÍODO', margin + 5, currentY + 12);
    
    pdf.setFontSize(14);
    pdf.text(
      `${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`,
      margin + 5, currentY + 20
    );
    
    // Resultado líquido
    const netResult = data.totals.received - data.totals.paid;
    pdf.setFontSize(18);
    pdf.setTextColor(netResult >= 0 ? 34 : 239, netResult >= 0 ? 197 : 68, netResult >= 0 ? 94 : 68);
    pdf.text('RESULTADO LÍQUIDO:', margin + 5, currentY + 30);
    pdf.setFontSize(22);
    pdf.text(
      `${netResult >= 0 ? '+' : ''}R$ ${netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      margin + 5, currentY + 40
    );
    
    // Saldo do caixa
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Saldo do Caixa: R$ ${data.totals.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      margin + 100, currentY + 35);

    currentY += 60;

    // Footer moderno
    const footerY = pageHeight - 20;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, footerY - 5, pageWidth, 25, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    
    pdf.text(
      `Relatório gerado pelo Sistema RevGold em ${new Date().toLocaleString('pt-BR')}`,
      pageWidth / 2, footerY + 5, { align: 'center' }
    );
    pdf.text(
      `© ${new Date().getFullYear()} RevGold - Sistema de Gestão Empresarial Profissional`,
      pageWidth / 2, footerY + 12, { align: 'center' }
    );

    // Salvar o PDF
    const fileName = `RevGold_Relatorio_${new Date(startDate).toLocaleDateString('pt-BR').replace(/\//g, '-')}_ate_${new Date(endDate).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);

    console.log('✅ Relatório PDF gerado com sucesso:', fileName);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}