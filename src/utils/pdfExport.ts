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
    console.log('🔄 Iniciando geração do PDF profissional...');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurações profissionais
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let currentY = margin;

    // Cores do tema RevGold
    const colors = {
      primary: [22, 163, 74],      // Verde principal
      secondary: [5, 150, 105],    // Verde escuro
      accent: [52, 211, 153],      // Verde claro
      success: [34, 197, 94],      // Verde sucesso
      warning: [251, 146, 60],     // Laranja
      error: [239, 68, 68],        // Vermelho
      dark: [30, 41, 59],          // Azul escuro
      light: [248, 250, 252],      // Cinza claro
      text: [51, 65, 85]           // Texto principal
    };

    // Função para verificar quebra de página
    const checkPageBreak = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin - 15) {
        addFooter();
        pdf.addPage();
        currentY = margin;
        addHeader();
        return true;
      }
      return false;
    };

    // Função para adicionar cabeçalho em todas as páginas
    const addHeader = () => {
      // Background do cabeçalho
      pdf.setFillColor(...colors.primary);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      
      // Gradiente simulado
      pdf.setFillColor(16, 185, 129);
      pdf.rect(0, 35, pageWidth, 10, 'F');
      
      // Logo e título
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('RevGold', margin, 25);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sistema de Gestão Empresarial Profissional', margin, 35);
      
      // Data e hora no canto direito
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      const now = new Date().toLocaleString('pt-BR');
      pdf.text(`Gerado em: ${now}`, pageWidth - margin - 50, 25);
      
      currentY = 55;
    };

    // Função para adicionar rodapé
    const addFooter = () => {
      const footerY = pageHeight - 15;
      
      // Linha decorativa
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(0.5);
      pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.text);
      
      // Informações do sistema
      pdf.text(
        `© ${new Date().getFullYear()} RevGold - Relatório Financeiro Profissional`,
        margin, footerY
      );
      
      // Número da página
      const pageNum = pdf.internal.getCurrentPageInfo().pageNumber;
      pdf.text(`Página ${pageNum}`, pageWidth - margin - 20, footerY);
    };

    // Função para adicionar texto com estilo
    const addStyledText = (text: string, x: number, y: number, options: any = {}) => {
      const fontSize = options.fontSize || 10;
      const maxWidth = options.maxWidth || contentWidth;
      const fontStyle = options.fontStyle || 'normal';
      const color = options.color || colors.text;
      
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      pdf.setTextColor(...color);
      
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      
      return y + (lines.length * fontSize * 0.4) + (options.marginBottom || 0);
    };

    // Função para criar seção com título
    const addSection = (title: string, bgColor: number[], textColor: number[] = [255, 255, 255]) => {
      checkPageBreak(20);
      
      // Background da seção
      pdf.setFillColor(...bgColor);
      pdf.rect(margin, currentY, contentWidth, 15, 'F');
      
      // Gradiente simulado
      const lighterColor = bgColor.map(c => Math.min(255, c + 30));
      pdf.setFillColor(...lighterColor);
      pdf.rect(margin, currentY + 12, contentWidth, 3, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...textColor);
      pdf.text(title, margin + 5, currentY + 10);
      
      currentY += 25;
    };

    // Função para criar card de resumo
    const addSummaryCard = (title: string, value: string, subtitle: string, color: number[], x: number, y: number, width: number) => {
      // Background do card
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, width, 25, 'F');
      
      // Border colorida
      pdf.setFillColor(...color);
      pdf.rect(x, y, width, 3, 'F');
      
      // Sombra simulada
      pdf.setFillColor(240, 240, 240);
      pdf.rect(x + 1, y + 1, width, 25, 'F');
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, width, 25, 'F');
      pdf.setFillColor(...color);
      pdf.rect(x, y, width, 3, 'F');
      
      // Conteúdo do card
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...color);
      pdf.text(title, x + 3, y + 8);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.text);
      pdf.text(value, x + 3, y + 15);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(subtitle, x + 3, y + 21);
    };

    // Iniciar PDF
    addHeader();

    // Título do relatório
    addSection('RELATÓRIO FINANCEIRO DETALHADO', colors.dark);

    // Informações do período
    currentY = addStyledText(
      `Período Analisado: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`,
      margin, currentY, { fontSize: 12, fontStyle: 'bold', color: colors.primary }
    );
    
    const periodDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    currentY = addStyledText(
      `Total de ${periodDays} dias analisados`,
      margin, currentY + 3, { fontSize: 10, color: [100, 100, 100] }
    );

    currentY += 15;

    // RESUMO EXECUTIVO com cards modernos
    addSection('RESUMO EXECUTIVO', colors.primary);

    // Cards de resumo em grid
    const cardWidth = (contentWidth - 15) / 4;
    const cardY = currentY;

    addSummaryCard(
      'VENDAS REALIZADAS',
      `R$ ${data.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${data.sales.length} venda(s)`,
      colors.success,
      margin,
      cardY,
      cardWidth
    );

    addSummaryCard(
      'VALORES RECEBIDOS',
      `R$ ${data.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${data.receivedValues.length} recebimento(s)`,
      colors.secondary,
      margin + cardWidth + 5,
      cardY,
      cardWidth
    );

    addSummaryCard(
      'DÍVIDAS FEITAS',
      `R$ ${data.totals.debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${data.debts.length} dívida(s)`,
      colors.error,
      margin + (cardWidth + 5) * 2,
      cardY,
      cardWidth
    );

    addSummaryCard(
      'VALORES PAGOS',
      `R$ ${data.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${data.paidValues.length} pagamento(s)`,
      colors.warning,
      margin + (cardWidth + 5) * 3,
      cardY,
      cardWidth
    );

    currentY += 35;

    // Resultado Líquido com destaque especial
    checkPageBreak(35);
    
    const netResult = data.totals.received - data.totals.paid;
    const resultColor = netResult >= 0 ? colors.success : colors.error;
    
    // Background com gradiente simulado
    pdf.setFillColor(...resultColor);
    pdf.rect(margin, currentY, contentWidth, 30, 'F');
    
    const lighterResultColor = resultColor.map(c => Math.min(255, c + 40));
    pdf.setFillColor(...lighterResultColor);
    pdf.rect(margin, currentY, contentWidth, 8, 'F');
    
    // Ícone simulado
    pdf.setFillColor(255, 255, 255);
    pdf.circle(margin + 15, currentY + 15, 8, 'F');
    pdf.setFontSize(16);
    pdf.setTextColor(...resultColor);
    pdf.text(netResult >= 0 ? '↗' : '↘', margin + 12, currentY + 18);
    
    // Texto do resultado
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('RESULTADO LÍQUIDO DO PERÍODO', margin + 30, currentY + 12);
    
    pdf.setFontSize(20);
    pdf.text(
      `${netResult >= 0 ? '+' : ''}R$ ${netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      margin + 30, currentY + 22
    );

    currentY += 40;

    // Saldo do Caixa
    checkPageBreak(25);
    
    pdf.setFillColor(...colors.dark);
    pdf.rect(margin, currentY, contentWidth, 20, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('SALDO ATUAL DO CAIXA', margin + 5, currentY + 8);
    pdf.setFontSize(16);
    pdf.text(
      `R$ ${data.totals.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      margin + 5, currentY + 16
    );

    currentY += 30;

    // SEÇÃO 1: VENDAS DETALHADAS
    if (data.sales.length > 0) {
      addSection('1. VENDAS REALIZADAS - ANÁLISE DETALHADA', colors.success);
      
      data.sales.forEach((sale, index) => {
        checkPageBreak(80);
        
        // Card da venda com design moderno
        pdf.setFillColor(240, 253, 244);
        pdf.rect(margin, currentY, contentWidth, 12, 'F');
        
        // Border verde
        pdf.setFillColor(...colors.success);
        pdf.rect(margin, currentY, 5, 12, 'F');
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.success);
        pdf.text(`VENDA ${index + 1}: ${sale.client}`, margin + 8, currentY + 8);
        
        currentY += 18;
        
        // Grid de informações básicas
        const infoY = currentY;
        
        // Coluna 1 - Informações básicas
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.text);
        currentY = addStyledText('INFORMAÇÕES BÁSICAS', margin + 5, currentY, { 
          fontSize: 11, fontStyle: 'bold', color: colors.primary 
        });
        
        pdf.setFont('helvetica', 'normal');
        currentY = addStyledText(`Data: ${new Date(sale.date).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 2);
        
        if (sale.deliveryDate) {
          currentY = addStyledText(`Entrega: ${new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 2);
        }
        
        if (sale.sellerId) {
          const seller = data.employees?.find(e => e.id === sale.sellerId);
          currentY = addStyledText(`Vendedor: ${seller?.name || 'N/A'}`, margin + 5, currentY + 2);
          currentY = addStyledText(`Comissão: ${sale.customCommissionRate}% = R$ ${((sale.totalValue * (sale.customCommissionRate || 0)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
            margin + 5, currentY + 2, { color: colors.secondary });
        }
        
        // Coluna 2 - Valores (lado direito)
        let valuesY = infoY;
        pdf.setFont('helvetica', 'bold');
        valuesY = addStyledText('VALORES', margin + 100, valuesY, { 
          fontSize: 11, fontStyle: 'bold', color: colors.primary 
        });
        
        pdf.setFont('helvetica', 'normal');
        valuesY = addStyledText(`Total: R$ ${sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
          margin + 100, valuesY + 2, { fontSize: 12, fontStyle: 'bold' });
        valuesY = addStyledText(`Recebido: R$ ${sale.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
          margin + 100, valuesY + 2, { color: colors.success });
        valuesY = addStyledText(`Pendente: R$ ${sale.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
          margin + 100, valuesY + 2, { color: colors.warning });
        
        // Status com destaque
        const statusColor = sale.status === 'pago' ? colors.success : 
                           sale.status === 'parcial' ? colors.warning : colors.error;
        valuesY = addStyledText(`Status: ${sale.status.toUpperCase()}`, 
          margin + 100, valuesY + 2, { fontStyle: 'bold', color: statusColor });
        
        currentY = Math.max(currentY, valuesY) + 8;
        
        // Produtos
        currentY = addStyledText('PRODUTOS VENDIDOS', margin + 5, currentY, { 
          fontSize: 11, fontStyle: 'bold', color: colors.primary 
        });
        currentY = addStyledText(
          typeof sale.products === 'string' ? sale.products : 'Produtos vendidos',
          margin + 5, currentY + 2, { maxWidth: contentWidth - 10, fontSize: 10 }
        );
        
        currentY += 8;
        
        // Métodos de pagamento com design aprimorado
        currentY = addStyledText('MÉTODOS DE PAGAMENTO DETALHADOS', margin + 5, currentY, { 
          fontSize: 11, fontStyle: 'bold', color: colors.primary 
        });
        
        (sale.paymentMethods || []).forEach((method, methodIndex) => {
          checkPageBreak(25);
          
          // Card do método de pagamento
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin + 5, currentY, contentWidth - 10, 20, 'F');
          
          // Border colorida baseada no tipo
          const methodColors = {
            'dinheiro': colors.success,
            'pix': [59, 130, 246],
            'cartao_credito': [147, 51, 234],
            'cartao_debito': [99, 102, 241],
            'cheque': [245, 158, 11],
            'boleto': [6, 182, 212],
            'transferencia': [107, 114, 128]
          };
          const methodColor = methodColors[method.type] || colors.text;
          pdf.setFillColor(...methodColor);
          pdf.rect(margin + 5, currentY, 3, 20, 'F');
          
          currentY += 5;
          
          // Título do método
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...methodColor);
          pdf.text(
            `${methodIndex + 1}. ${method.type.replace('_', ' ').toUpperCase()}`,
            margin + 12, currentY
          );
          
          // Valor do método
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...colors.success);
          pdf.text(
            `R$ ${method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            margin + contentWidth - 50, currentY
          );
          
          currentY += 5;
          
          // Detalhes do parcelamento
          if (method.installments && method.installments > 1) {
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...colors.text);
            pdf.text(
              `Parcelado: ${method.installments}x de R$ ${(method.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${method.installmentInterval} dias)`,
              margin + 12, currentY
            );
            
            if (method.firstInstallmentDate) {
              currentY += 3;
              pdf.text(
                `Primeira parcela: ${new Date(method.firstInstallmentDate).toLocaleDateString('pt-BR')}`,
                margin + 12, currentY
              );
            }
          }
          
          currentY += 8;
          
          // Detalhes específicos por tipo
          if (method.type === 'cheque' && method.thirdPartyDetails && method.thirdPartyDetails.length > 0) {
            currentY = addStyledText('Cheques de Terceiros:', margin + 12, currentY, { 
              fontSize: 10, fontStyle: 'bold', color: colors.warning 
            });
            
            method.thirdPartyDetails.forEach((checkDetail, checkIndex) => {
              checkPageBreak(15);
              currentY = addStyledText(
                `${checkIndex + 1}. ${checkDetail.issuer} (${checkDetail.cpfCnpj})`,
                margin + 15, currentY + 2, { fontSize: 9 }
              );
              currentY = addStyledText(
                `   Banco: ${checkDetail.bank} | Ag: ${checkDetail.agency} | Conta: ${checkDetail.account} | Cheque: ${checkDetail.checkNumber}`,
                margin + 15, currentY + 2, { fontSize: 8, color: [100, 100, 100] }
              );
              
              if (checkDetail.observations) {
                currentY = addStyledText(
                  `   Obs: ${checkDetail.observations}`,
                  margin + 15, currentY + 2, { fontSize: 8, color: [100, 100, 100] }
                );
              }
            });
          }
          
          currentY += 5;
        });
        
        // Observações da venda
        if (sale.observations || sale.paymentObservations) {
          currentY += 5;
          currentY = addStyledText('OBSERVAÇÕES', margin + 5, currentY, { 
            fontSize: 11, fontStyle: 'bold', color: colors.primary 
          });
          
          if (sale.observations) {
            currentY = addStyledText(`Gerais: ${sale.observations}`, margin + 5, currentY + 2, 
              { maxWidth: contentWidth - 10, fontSize: 9, color: [100, 100, 100] });
          }
          
          if (sale.paymentObservations) {
            currentY = addStyledText(`Pagamento: ${sale.paymentObservations}`, margin + 5, currentY + 2, 
              { maxWidth: contentWidth - 10, fontSize: 9, color: [100, 100, 100] });
          }
        }
        
        currentY += 15;
      });
      
      // Total de vendas com destaque
      checkPageBreak(25);
      pdf.setFillColor(...colors.success);
      pdf.rect(margin, currentY, contentWidth, 20, 'F');
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL GERAL DE VENDAS: R$ ${data.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 13
      );
      
      currentY += 30;
    }

    // SEÇÃO 2: VALORES RECEBIDOS
    if (data.receivedValues.length > 0) {
      addSection('2. VALORES EFETIVAMENTE RECEBIDOS', colors.secondary);
      
      // Agrupar por tipo para melhor visualização
      const groupedReceived = data.receivedValues.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
      }, {});
      
      Object.entries(groupedReceived).forEach(([type, items]: [string, any[]]) => {
        checkPageBreak(30);
        
        // Subtítulo do tipo
        pdf.setFillColor(236, 253, 245);
        pdf.rect(margin, currentY, contentWidth, 10, 'F');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.secondary);
        pdf.text(`${type.toUpperCase()} (${items.length} recebimento(s))`, margin + 5, currentY + 7);
        
        currentY += 15;
        
        items.forEach((item, index) => {
          checkPageBreak(20);
          
          // Item de recebimento
          pdf.setFillColor(255, 255, 255);
          pdf.rect(margin + 5, currentY, contentWidth - 10, 15, 'F');
          
          // Border verde
          pdf.setFillColor(...colors.secondary);
          pdf.rect(margin + 5, currentY, 2, 15, 'F');
          
          // Conteúdo
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...colors.text);
          pdf.text(`${index + 1}. ${item.description}`, margin + 10, currentY + 5);
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...colors.success);
          pdf.text(
            `R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            margin + contentWidth - 50, currentY + 5
          );
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            `${new Date(item.date).toLocaleDateString('pt-BR')} | ${item.paymentMethod}`,
            margin + 10, currentY + 10
          );
          
          currentY += 20;
        });
        
        currentY += 5;
      });
      
      // Total recebido
      checkPageBreak(25);
      pdf.setFillColor(...colors.secondary);
      pdf.rect(margin, currentY, contentWidth, 20, 'F');
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL RECEBIDO: R$ ${data.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 13
      );
      
      currentY += 30;
    }

    // SEÇÃO 3: DÍVIDAS
    if (data.debts.length > 0) {
      addSection('3. DÍVIDAS E GASTOS REALIZADOS', colors.error);
      
      data.debts.forEach((debt, index) => {
        checkPageBreak(60);
        
        // Card da dívida
        pdf.setFillColor(254, 242, 242);
        pdf.rect(margin, currentY, contentWidth, 12, 'F');
        
        // Border vermelha
        pdf.setFillColor(...colors.error);
        pdf.rect(margin, currentY, 5, 12, 'F');
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.error);
        pdf.text(`DÍVIDA ${index + 1}: ${debt.company}`, margin + 8, currentY + 8);
        
        currentY += 18;
        
        // Informações da dívida
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);
        
        currentY = addStyledText(`Data: ${new Date(debt.date).toLocaleDateString('pt-BR')}`, margin + 5, currentY + 2);
        currentY = addStyledText(`Descrição: ${debt.description}`, margin + 5, currentY + 2, 
          { maxWidth: contentWidth - 10 });
        
        // Valores da dívida
        pdf.setFont('helvetica', 'bold');
        currentY = addStyledText(`Valor Total: R$ ${debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
          margin + 5, currentY + 3, { fontSize: 12, color: colors.error });
        
        pdf.setFont('helvetica', 'normal');
        currentY = addStyledText(`Pago: R$ ${debt.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
          margin + 5, currentY + 2, { color: colors.success });
        currentY = addStyledText(`Pendente: R$ ${debt.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
          margin + 5, currentY + 2, { color: colors.warning });
        
        // Métodos de pagamento
        currentY = addStyledText('Formas de Pagamento:', margin + 5, currentY + 5, { 
          fontSize: 11, fontStyle: 'bold', color: colors.primary 
        });
        
        (debt.paymentMethods || []).forEach(method => {
          currentY = addStyledText(
            `• ${method.type.replace('_', ' ').toUpperCase()}: R$ ${method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            margin + 8, currentY + 2
          );
          
          if (method.installments && method.installments > 1) {
            currentY = addStyledText(
              `  ${method.installments}x de R$ ${(method.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              margin + 12, currentY + 2, { fontSize: 9, color: [100, 100, 100] }
            );
          }
        });
        
        currentY += 10;
      });
      
      // Total de dívidas
      checkPageBreak(25);
      pdf.setFillColor(...colors.error);
      pdf.rect(margin, currentY, contentWidth, 20, 'F');
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL DE DÍVIDAS: R$ ${data.totals.debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 13
      );
      
      currentY += 30;
    }

    // SEÇÃO 4: VALORES PAGOS
    if (data.paidValues.length > 0) {
      addSection('4. VALORES EFETIVAMENTE PAGOS', colors.warning);
      
      // Agrupar por tipo
      const groupedPaid = data.paidValues.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
      }, {});
      
      Object.entries(groupedPaid).forEach(([type, items]: [string, any[]]) => {
        checkPageBreak(25);
        
        // Subtítulo do tipo
        pdf.setFillColor(255, 247, 237);
        pdf.rect(margin, currentY, contentWidth, 10, 'F');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.warning);
        pdf.text(`${type.toUpperCase()} (${items.length} pagamento(s))`, margin + 5, currentY + 7);
        
        currentY += 15;
        
        items.forEach((item, index) => {
          checkPageBreak(15);
          
          // Item de pagamento
          pdf.setFillColor(255, 255, 255);
          pdf.rect(margin + 5, currentY, contentWidth - 10, 12, 'F');
          
          // Border laranja
          pdf.setFillColor(...colors.warning);
          pdf.rect(margin + 5, currentY, 2, 12, 'F');
          
          // Conteúdo
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...colors.text);
          pdf.text(`${index + 1}. ${item.description}`, margin + 10, currentY + 4);
          
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...colors.warning);
          pdf.text(
            `R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            margin + contentWidth - 50, currentY + 4
          );
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            `${new Date(item.date).toLocaleDateString('pt-BR')} | ${item.paymentMethod}`,
            margin + 10, currentY + 9
          );
          
          currentY += 15;
        });
        
        currentY += 5;
      });
      
      // Total pago
      checkPageBreak(25);
      pdf.setFillColor(...colors.warning);
      pdf.rect(margin, currentY, contentWidth, 20, 'F');
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(
        `TOTAL PAGO: R$ ${data.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        margin + 5, currentY + 13
      );
      
      currentY += 30;
    }

    // RESUMO FINAL PREMIUM
    checkPageBreak(80);
    
    // Background com gradiente simulado
    pdf.setFillColor(...colors.dark);
    pdf.rect(margin, currentY, contentWidth, 70, 'F');
    
    // Gradiente superior
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, currentY, contentWidth, 15, 'F');
    
    // Título principal
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('RESUMO FINAL EXECUTIVO', margin + 5, currentY + 10);
    
    currentY += 20;
    
    // Período
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(200, 200, 200);
    pdf.text(
      `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`,
      margin + 5, currentY + 5
    );
    
    currentY += 15;
    
    // Grid de resultados finais
    const finalCardWidth = (contentWidth - 15) / 4;
    
    // Card 1 - Vendas
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, currentY, finalCardWidth, 25, 'F');
    pdf.setFillColor(...colors.success);
    pdf.rect(margin, currentY, finalCardWidth, 3, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.success);
    pdf.text('VENDAS', margin + 3, currentY + 8);
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.text);
    pdf.text(`R$ ${data.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 3, currentY + 15);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${data.sales.length} venda(s)`, margin + 3, currentY + 20);
    
    // Card 2 - Recebido
    const card2X = margin + finalCardWidth + 5;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(card2X, currentY, finalCardWidth, 25, 'F');
    pdf.setFillColor(...colors.secondary);
    pdf.rect(card2X, currentY, finalCardWidth, 3, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.secondary);
    pdf.text('RECEBIDO', card2X + 3, currentY + 8);
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.text);
    pdf.text(`R$ ${data.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, card2X + 3, currentY + 15);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${data.receivedValues.length} recebimento(s)`, card2X + 3, currentY + 20);
    
    // Card 3 - Pago
    const card3X = margin + (finalCardWidth + 5) * 2;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(card3X, currentY, finalCardWidth, 25, 'F');
    pdf.setFillColor(...colors.warning);
    pdf.rect(card3X, currentY, finalCardWidth, 3, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.warning);
    pdf.text('PAGO', card3X + 3, currentY + 8);
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.text);
    pdf.text(`R$ ${data.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, card3X + 3, currentY + 15);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${data.paidValues.length} pagamento(s)`, card3X + 3, currentY + 20);
    
    // Card 4 - Resultado
    const card4X = margin + (finalCardWidth + 5) * 3;
    const resultColor = netResult >= 0 ? colors.success : colors.error;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(card4X, currentY, finalCardWidth, 25, 'F');
    pdf.setFillColor(...resultColor);
    pdf.rect(card4X, currentY, finalCardWidth, 3, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...resultColor);
    pdf.text('RESULTADO', card4X + 3, currentY + 8);
    pdf.setFontSize(12);
    pdf.setTextColor(...resultColor);
    pdf.text(
      `${netResult >= 0 ? '+' : ''}R$ ${netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      card4X + 3, currentY + 15
    );
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Líquido', card4X + 3, currentY + 20);

    currentY += 35;

    // Análise final
    checkPageBreak(30);
    
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, currentY, contentWidth, 25, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text('ANÁLISE FINANCEIRA', margin + 5, currentY + 8);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);
    
    const analysis = [
      `• Período analisado: ${periodDays} dias`,
      `• Faturamento médio diário: R$ ${(data.totals.sales / periodDays).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `• Taxa de recebimento: ${((data.totals.received / Math.max(data.totals.sales, 1)) * 100).toFixed(1)}%`,
      `• Resultado líquido: ${netResult >= 0 ? 'POSITIVO' : 'NEGATIVO'} (${((netResult / Math.max(data.totals.received, 1)) * 100).toFixed(1)}%)`
    ];
    
    analysis.forEach((line, index) => {
      pdf.text(line, margin + 5, currentY + 15 + (index * 4));
    });

    // Adicionar rodapé na última página
    addFooter();

    // Salvar o PDF com nome descritivo
    const fileName = `RevGold_Relatorio_Completo_${new Date(startDate).toLocaleDateString('pt-BR').replace(/\//g, '-')}_ate_${new Date(endDate).toLocaleDateString('pt-BR').replace(/\//g, '-')}_${new Date().getTime()}.pdf`;
    pdf.save(fileName);

    console.log('✅ Relatório PDF profissional gerado com sucesso:', fileName);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}