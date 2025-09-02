import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

export async function exportReportToPDF(reportData: ReportData, startDate: string, endDate: string): Promise<void> {
  try {
    console.log('🔄 Gerando PDF do relatório...');
    
    // Create a new jsPDF instance
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Relatório Financeiro - RevGold', pageWidth / 2, 20, { align: 'center' });
    
    // Add period
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const periodText = `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`;
    pdf.text(periodText, pageWidth / 2, 30, { align: 'center' });
    
    // Add generation date
    pdf.setFontSize(10);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 40, { align: 'center' });
    
    let yPosition = 60;
    
    // Summary section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMO EXECUTIVO', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const summaryData = [
      ['Vendas Realizadas:', `R$ ${reportData.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Valores Recebidos:', `R$ ${reportData.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Dívidas Feitas:', `R$ ${reportData.totals.debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Valores Pagos:', `R$ ${reportData.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Resultado Líquido:', `R$ ${(reportData.totals.received - reportData.totals.paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Saldo Final do Caixa:', `R$ ${reportData.totals.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
    ];
    
    summaryData.forEach(([label, value]) => {
      pdf.text(label, 20, yPosition);
      pdf.setFont('helvetica', 'bold');
      pdf.text(value, 120, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition += 8;
    });
    
    // Add new page for detailed data if needed
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Sales section
    if (reportData.sales.length > 0) {
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VENDAS REALIZADAS', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      reportData.sales.slice(0, 10).forEach((sale) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(`• ${sale.client} - ${new Date(sale.date).toLocaleDateString('pt-BR')}`, 25, yPosition);
        pdf.text(`R$ ${sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 150, yPosition);
        yPosition += 6;
      });
    }
    
    // Save the PDF
    const fileName = `relatorio-revgold-${startDate}-${endDate}.pdf`;
    pdf.save(fileName);
    
    console.log('✅ PDF gerado com sucesso:', fileName);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}