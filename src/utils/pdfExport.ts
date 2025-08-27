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
    
    // Criar PDF diretamente sem html2canvas
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurações
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let currentY = margin;

    // Função para adicionar nova página se necessário
    const checkPageBreak = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin) {
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
      
      pdf.setFontSize(fontSize);
      if (options.fontStyle) pdf.setFont('helvetica', options.fontStyle);
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      
      return y + (lines.length * fontSize * 0.35);
    };

    // Header do PDF
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(22, 163, 74); // Verde RevGold
    currentY = addText('RevGold - Sistema de Gestão', margin, currentY);
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    currentY = addText('Relatório Financeiro Detalhado', margin, currentY + 10);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    currentY = addText(
      `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`,
      margin, currentY + 5
    );
    currentY = addText(
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      margin, currentY + 5
    );

    currentY += 15;

    // Resumo Executivo
    checkPageBreak(60);
    
    pdf.setFillColor(59, 130, 246); // Azul
    pdf.rect(margin, currentY, contentWidth, 8, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('RESUMO EXECUTIVO DO PERÍODO', margin + 5, currentY + 6);
    
    currentY += 15;
    
    // Grid de resumo
    const summaryData = [
      ['Vendas Realizadas', `R$ ${data.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, `${data.sales.length} venda(s)`],
      ['Valores Recebidos', `R$ ${data.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, `${data.receivedValues.length} recebimento(s)`],
      ['Dívidas Feitas', `R$ ${data.totals.debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, `${data.debts.length} dívida(s)`],
      ['Valores Pagos', `R$ ${data.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, `${data.paidValues.length} pagamento(s)`]
    ];

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    summaryData.forEach((row, index) => {
      const y = currentY + (index * 12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(row[0], margin, y);
      pdf.setFont('helvetica', 'bold');
      pdf.text(row[1], margin + 60, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(row[2], margin + 120, y);
    });

    currentY += 60;

    // Resultado Líquido
    checkPageBreak(25);
    
    const netResult = data.totals.received - data.totals.paid;
    const resultColor = netResult >= 0 ? [22, 163, 74] : [220, 38, 38]; // Verde ou vermelho
    
    pdf.setFillColor(...resultColor);
    pdf.rect(margin, currentY, contentWidth, 20, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('RESULTADO LÍQUIDO DO PERÍODO', margin + 5, currentY + 8);
    pdf.text(
      `${netResult >= 0 ? '+' : ''}R$ ${netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      margin + 5, currentY + 16
    );

    currentY += 30;

    // Saldo Final do Caixa
    checkPageBreak(25);
    
    pdf.setFillColor(59, 130, 246); // Azul
    pdf.rect(margin, currentY, contentWidth, 20, 'F');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('SALDO FINAL DO CAIXA', margin + 5, currentY + 8);
    pdf.text(
      `R$ ${data.totals.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      margin + 5, currentY + 16
    );

    currentY += 40;

    // Seção 1: VENDAS
    if (data.sales.length > 0) {
      checkPageBreak(30);
      
      pdf.setFillColor(22, 163, 74); // Verde
      pdf.rect(margin, currentY, contentWidth, 10, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`1. VENDAS REALIZADAS (${data.sales.length} venda(s))`, margin + 5, currentY + 7);
      
      currentY += 20;
      
      data.sales.forEach((sale, index) => {
        checkPageBreak(40);
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        currentY = addText(`${index + 1}. ${sale.client}`, margin, currentY);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        currentY = addText(`Data: ${new Date(sale.date).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 3);
        
        if (sale.deliveryDate) {
          currentY = addText(`Entrega: ${new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 3);
        }
        
        currentY = addText(`Produtos: ${typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}`, margin + 5, currentY + 3, { maxWidth: contentWidth - 10 });
        
        if (sale.sellerId) {
          const seller = data.employees?.find(e => e.id === sale.sellerId);
          if (seller) {
            currentY = addText(`Vendedor: ${seller.name}`, margin + 5, currentY + 3);
          }
        }
        
        pdf.setFont('helvetica', 'bold');
        currentY = addText(`Valor Total: R$ ${sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 5, currentY + 3);
        
        // Formas de pagamento
        pdf.setFont('helvetica', 'normal');
        currentY = addText('Formas de Pagamento:', margin + 5, currentY + 5);
        
        (sale.paymentMethods || []).forEach(method => {
          currentY = addText(
            `• ${method.type.replace('_', ' ').toUpperCase()}: R$ ${method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            margin + 10, currentY + 3
          );
          
          if (method.installments && method.installments > 1) {
            currentY = addText(
              `  ${method.installments}x de R$ ${(method.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              margin + 15, currentY + 3
            );
          }
        });
        
        if (sale.observations) {
          currentY = addText(`Observações: ${sale.observations}`, margin + 5, currentY + 5, { maxWidth: contentWidth - 10 });
        }
        
        currentY += 10;
      });
      
      // Total de vendas
      checkPageBreak(15);
      pdf.setFillColor(34, 197, 94); // Verde claro
      pdf.rect(margin, currentY, contentWidth, 12, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL DE VENDAS: R$ ${data.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 8
      );
      
      currentY += 25;
    }

    // Seção 2: VALORES RECEBIDOS
    if (data.receivedValues.length > 0) {
      checkPageBreak(30);
      
      pdf.setFillColor(5, 150, 105); // Verde escuro
      pdf.rect(margin, currentY, contentWidth, 10, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`2. VALORES RECEBIDOS (${data.receivedValues.length} recebimento(s))`, margin + 5, currentY + 7);
      
      currentY += 20;
      
      data.receivedValues.forEach((item, index) => {
        checkPageBreak(25);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        currentY = addText(`${index + 1}. ${item.description}`, margin, currentY);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        currentY = addText(`Tipo: ${item.type} | Método: ${item.paymentMethod}`, margin + 5, currentY + 3);
        currentY = addText(`Data: ${new Date(item.date).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 3);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(5, 150, 105);
        currentY = addText(`Valor: R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 5, currentY + 3);
        
        pdf.setTextColor(0, 0, 0);
        currentY += 8;
      });
      
      // Total recebido
      checkPageBreak(15);
      pdf.setFillColor(16, 185, 129);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL RECEBIDO: R$ ${data.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 8
      );
      
      currentY += 25;
    }

    // Seção 3: DÍVIDAS FEITAS
    if (data.debts.length > 0) {
      checkPageBreak(30);
      
      pdf.setFillColor(220, 38, 38); // Vermelho
      pdf.rect(margin, currentY, contentWidth, 10, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`3. DÍVIDAS FEITAS (${data.debts.length} dívida(s))`, margin + 5, currentY + 7);
      
      currentY += 20;
      
      data.debts.forEach((debt, index) => {
        checkPageBreak(30);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        currentY = addText(`${index + 1}. ${debt.company}`, margin, currentY);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        currentY = addText(`Descrição: ${debt.description}`, margin + 5, currentY + 3, { maxWidth: contentWidth - 10 });
        currentY = addText(`Data: ${new Date(debt.date).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 3);
        currentY = addText(`Status: ${debt.isPaid ? 'PAGO' : 'PENDENTE'}`, margin + 5, currentY + 3);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(220, 38, 38);
        currentY = addText(`Valor Total: R$ ${debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 5, currentY + 3);
        
        // Métodos de pagamento
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        currentY = addText('Formas de Pagamento:', margin + 5, currentY + 5);
        
        (debt.paymentMethods || []).forEach(method => {
          currentY = addText(
            `• ${method.type.replace('_', ' ').toUpperCase()}: R$ ${method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            margin + 10, currentY + 3
          );
        });
        
        currentY += 8;
      });
      
      // Total de dívidas
      checkPageBreak(15);
      pdf.setFillColor(239, 68, 68);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL DE DÍVIDAS: R$ ${data.totals.debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 8
      );
      
      currentY += 25;
    }

    // Seção 4: VALORES PAGOS
    if (data.paidValues.length > 0) {
      checkPageBreak(30);
      
      pdf.setFillColor(234, 88, 12); // Laranja
      pdf.rect(margin, currentY, contentWidth, 10, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`4. VALORES PAGOS (${data.paidValues.length} pagamento(s))`, margin + 5, currentY + 7);
      
      currentY += 20;
      
      data.paidValues.forEach((item, index) => {
        checkPageBreak(25);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        currentY = addText(`${index + 1}. ${item.description}`, margin, currentY);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        currentY = addText(`Tipo: ${item.type} | Método: ${item.paymentMethod}`, margin + 5, currentY + 3);
        currentY = addText(`Data: ${new Date(item.date).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 3);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(234, 88, 12);
        currentY = addText(`Valor: R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 5, currentY + 3);
        
        pdf.setTextColor(0, 0, 0);
        currentY += 8;
      });
      
      // Total pago
      checkPageBreak(15);
      pdf.setFillColor(251, 146, 60);
      pdf.rect(margin, currentY, contentWidth, 12, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL PAGO: R$ ${data.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 8
      );
      
      currentY += 25;
    }

    // Footer
    checkPageBreak(20);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    const footerY = pageHeight - 15;
    pdf.text(
      `Relatório gerado pelo Sistema RevGold em ${new Date().toLocaleString('pt-BR')}`,
      pageWidth / 2, footerY, { align: 'center' }
    );
    pdf.text(
      `© ${new Date().getFullYear()} RevGold - Sistema de Gestão Empresarial`,
      pageWidth / 2, footerY + 5, { align: 'center' }
    );

    // Salvar o PDF
    const fileName = `Relatorio_RevGold_${new Date(startDate).toLocaleDateString('pt-BR').replace(/\//g, '-')}_ate_${new Date(endDate).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);

    console.log('✅ Relatório PDF gerado com sucesso:', fileName);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}