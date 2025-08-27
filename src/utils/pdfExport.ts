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

export async function exportReportToPDF(data: ReportData, startDate: string, endDate: string) {
  try {
    // Create a temporary container for the PDF content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20mm';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Create the PDF content
    tempContainer.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px;">
          <img src="/cb880374-320a-47bb-bad0-66f68df2b834-removebg-preview.png" 
               style="width: 60px; height: 60px; object-fit: contain;" 
               onerror="this.style.display='none';" />
          <div>
            <h1 style="color: #16a34a; font-size: 32px; font-weight: bold; margin: 0;">RevGold</h1>
            <p style="color: #059669; font-size: 16px; margin: 0;">Sistema de Gestão Empresarial</p>
          </div>
        </div>
        <h2 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 20px 0;">
          Relatório Financeiro Detalhado
        </h2>
        <p style="color: #6b7280; font-size: 16px; margin: 0;">
          Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}
        </p>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">
          Gerado em: ${new Date().toLocaleString('pt-BR')}
        </p>
      </div>

      <!-- Resumo Executivo -->
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); padding: 20px; border-radius: 15px; margin-bottom: 30px; border: 2px solid #3b82f6;">
        <h3 style="color: #1e40af; font-size: 20px; font-weight: bold; margin: 0 0 20px 0; text-align: center;">
          RESUMO EXECUTIVO DO PERÍODO
        </h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
          <div style="text-align: center; padding: 15px; background: white; border-radius: 10px; border: 1px solid #3b82f6;">
            <p style="color: #1e40af; font-weight: bold; margin: 0 0 5px 0;">Vendas Realizadas</p>
            <p style="color: #16a34a; font-size: 24px; font-weight: bold; margin: 0;">
              R$ ${data.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p style="color: #1e40af; font-size: 12px; margin: 5px 0 0 0;">${data.sales.length} venda(s)</p>
          </div>
          <div style="text-align: center; padding: 15px; background: white; border-radius: 10px; border: 1px solid #3b82f6;">
            <p style="color: #1e40af; font-weight: bold; margin: 0 0 5px 0;">Valores Recebidos</p>
            <p style="color: #059669; font-size: 24px; font-weight: bold; margin: 0;">
              R$ ${data.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p style="color: #1e40af; font-size: 12px; margin: 5px 0 0 0;">${data.receivedValues.length} recebimento(s)</p>
          </div>
          <div style="text-align: center; padding: 15px; background: white; border-radius: 10px; border: 1px solid #3b82f6;">
            <p style="color: #1e40af; font-weight: bold; margin: 0 0 5px 0;">Dívidas Feitas</p>
            <p style="color: #dc2626; font-size: 24px; font-weight: bold; margin: 0;">
              R$ ${data.totals.debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p style="color: #1e40af; font-size: 12px; margin: 5px 0 0 0;">${data.debts.length} dívida(s)</p>
          </div>
          <div style="text-align: center; padding: 15px; background: white; border-radius: 10px; border: 1px solid #3b82f6;">
            <p style="color: #1e40af; font-weight: bold; margin: 0 0 5px 0;">Valores Pagos</p>
            <p style="color: #ea580c; font-size: 24px; font-weight: bold; margin: 0;">
              R$ ${data.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p style="color: #1e40af; font-size: 12px; margin: 5px 0 0 0;">${data.paidValues.length} pagamento(s)</p>
          </div>
        </div>
        <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 15px; border: 2px solid #16a34a;">
            <p style="color: #15803d; font-weight: bold; margin: 0 0 10px 0;">RESULTADO LÍQUIDO</p>
            <p style="color: ${(data.totals.received - data.totals.paid) >= 0 ? '#15803d' : '#dc2626'}; font-size: 28px; font-weight: bold; margin: 0;">
              ${(data.totals.received - data.totals.paid) >= 0 ? '+' : ''}R$ ${(data.totals.received - data.totals.paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p style="color: #15803d; font-size: 12px; margin: 5px 0 0 0;">Recebido - Pago</p>
          </div>
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 15px; border: 2px solid #3b82f6;">
            <p style="color: #1e40af; font-weight: bold; margin: 0 0 10px 0;">SALDO FINAL DO CAIXA</p>
            <p style="color: #1e40af; font-size: 28px; font-weight: bold; margin: 0;">
              R$ ${data.totals.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p style="color: #1e40af; font-size: 12px; margin: 5px 0 0 0;">
              Em ${new Date(endDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <!-- Vendas Detalhadas -->
      ${data.sales.length > 0 ? `
      <div style="margin-top: 40px;">
        <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #16a34a;">
          <h3 style="color: #15803d; font-size: 20px; font-weight: bold; margin: 0; text-align: center;">
            1. VENDAS REALIZADAS (${data.sales.length} venda(s))
          </h3>
        </div>
        ${data.sales.map(sale => `
          <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #16a34a;">
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 15px;">
              <div>
                <h4 style="color: #15803d; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">${sale.client}</h4>
                <p style="color: #166534; margin: 5px 0;"><strong>Data:</strong> ${new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                ${sale.deliveryDate ? `<p style="color: #166534; margin: 5px 0;"><strong>Entrega:</strong> ${new Date(sale.deliveryDate).toLocaleDateString('pt-BR')}</p>` : ''}
                <p style="color: #166534; margin: 5px 0;"><strong>Produtos:</strong> ${typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'}</p>
                <p style="color: #166534; margin: 5px 0;"><strong>Status:</strong> ${sale.status.toUpperCase()}</p>
              </div>
              <div style="text-align: right;">
                <p style="color: #15803d; font-weight: bold; margin: 0 0 5px 0;">Valor Total</p>
                <p style="color: #16a34a; font-size: 24px; font-weight: bold; margin: 0;">
                  R$ ${sale.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div>
              <p style="color: #15803d; font-weight: bold; margin: 0 0 10px 0;">Formas de Pagamento:</p>
              ${(sale.paymentMethods || []).map(method => `
                <div style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #bbf7d0;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #15803d; font-weight: bold;">${method.type.replace('_', ' ').toUpperCase()}</span>
                    <span style="color: #16a34a; font-weight: bold;">R$ ${method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  ${method.installments && method.installments > 1 ? `
                    <p style="color: #166534; font-size: 12px; margin: 5px 0 0 0;">
                      ${method.installments}x de R$ ${(method.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ${sale.observations ? `
              <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 8px; border: 1px solid #bbf7d0;">
                <p style="color: #15803d; font-weight: bold; margin: 0 0 5px 0;">Observações:</p>
                <p style="color: #166534; margin: 0; font-size: 14px;">${sale.observations}</p>
              </div>
            ` : ''}
          </div>
        `).join('')}
        <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 20px; border-radius: 15px; text-align: center; color: white; margin-top: 20px;">
          <h4 style="font-size: 20px; font-weight: bold; margin: 0 0 10px 0;">TOTAL DE VENDAS</h4>
          <p style="font-size: 32px; font-weight: bold; margin: 0;">
            R$ ${data.totals.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      ` : ''}

      <!-- Valores Recebidos -->
      ${data.receivedValues.length > 0 ? `
      <div style="margin-top: 40px;">
        <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #059669;">
          <h3 style="color: #047857; font-size: 20px; font-weight: bold; margin: 0; text-align: center;">
            2. VALORES RECEBIDOS (${data.receivedValues.length} recebimento(s))
          </h3>
        </div>
        ${data.receivedValues.map(item => `
          <div style="background: #ecfdf5; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #059669;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <div style="margin-bottom: 5px;">
                  <span style="background: ${item.type === 'Venda' ? '#dcfce7' : item.type === 'Cheque' ? '#fef3c7' : '#dbeafe'}; 
                              color: ${item.type === 'Venda' ? '#166534' : item.type === 'Cheque' ? '#92400e' : '#1e40af'}; 
                              padding: 4px 8px; border-radius: 20px; font-size: 10px; font-weight: bold; margin-right: 8px;">
                    ${item.type}
                  </span>
                  <span style="background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 20px; font-size: 10px; font-weight: bold;">
                    ${item.paymentMethod}
                  </span>
                </div>
                <h4 style="color: #047857; font-size: 16px; font-weight: bold; margin: 0;">${item.description}</h4>
                <p style="color: #065f46; font-size: 12px; margin: 5px 0 0 0;">
                  Data: ${new Date(item.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div style="text-align: right;">
                <p style="color: #059669; font-size: 20px; font-weight: bold; margin: 0;">
                  R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        `).join('')}
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 20px; border-radius: 15px; text-align: center; color: white; margin-top: 20px;">
          <h4 style="font-size: 20px; font-weight: bold; margin: 0 0 10px 0;">TOTAL RECEBIDO</h4>
          <p style="font-size: 32px; font-weight: bold; margin: 0;">
            R$ ${data.totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      ` : ''}

      <!-- Dívidas -->
      ${data.debts.length > 0 ? `
      <div style="margin-top: 40px;">
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #dc2626;">
          <h3 style="color: #991b1b; font-size: 20px; font-weight: bold; margin: 0; text-align: center;">
            3. DÍVIDAS FEITAS (${data.debts.length} dívida(s))
          </h3>
        </div>
        ${data.debts.map(debt => `
          <div style="background: #fef2f2; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #dc2626;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <h4 style="color: #991b1b; font-size: 16px; font-weight: bold; margin: 0;">${debt.company}</h4>
                <p style="color: #7f1d1d; font-size: 14px; margin: 5px 0;">${debt.description}</p>
                <p style="color: #7f1d1d; font-size: 12px; margin: 5px 0 0 0;">
                  Data: ${new Date(debt.date).toLocaleDateString('pt-BR')}
                </p>
                <p style="color: #7f1d1d; font-size: 12px; margin: 5px 0 0 0;">
                  Status: ${debt.isPaid ? 'PAGO' : 'PENDENTE'}
                </p>
              </div>
              <div style="text-align: right;">
                <p style="color: #dc2626; font-size: 20px; font-weight: bold; margin: 0;">
                  R$ ${debt.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div>
              <p style="color: #991b1b; font-weight: bold; margin: 0 0 8px 0;">Como será/foi pago:</p>
              ${(debt.paymentMethods || []).map(method => `
                <div style="background: white; padding: 8px; border-radius: 6px; margin-bottom: 5px; border: 1px solid #fecaca;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #991b1b; font-weight: bold; font-size: 12px;">${method.type.replace('_', ' ').toUpperCase()}</span>
                    <span style="color: #dc2626; font-weight: bold; font-size: 12px;">R$ ${method.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 20px; border-radius: 15px; text-align: center; color: white; margin-top: 20px;">
          <h4 style="font-size: 20px; font-weight: bold; margin: 0 0 10px 0;">TOTAL DE DÍVIDAS</h4>
          <p style="font-size: 32px; font-weight: bold; margin: 0;">
            R$ ${data.totals.debts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      ` : ''}

      <!-- Valores Pagos -->
      ${data.paidValues.length > 0 ? `
      <div style="margin-top: 40px;">
        <div style="background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #ea580c;">
          <h3 style="color: #c2410c; font-size: 20px; font-weight: bold; margin: 0; text-align: center;">
            4. VALORES PAGOS (${data.paidValues.length} pagamento(s))
          </h3>
        </div>
        ${data.paidValues.map(item => `
          <div style="background: #fff7ed; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #ea580c;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <div style="margin-bottom: 5px;">
                  <span style="background: ${item.type === 'Dívida' ? '#fef2f2' : item.type === 'Cheque Próprio' ? '#fef3c7' : item.type === 'Salário' ? '#f3e8ff' : '#dbeafe'}; 
                              color: ${item.type === 'Dívida' ? '#991b1b' : item.type === 'Cheque Próprio' ? '#92400e' : item.type === 'Salário' ? '#6b21a8' : '#1e40af'}; 
                              padding: 4px 8px; border-radius: 20px; font-size: 10px; font-weight: bold; margin-right: 8px;">
                    ${item.type}
                  </span>
                  <span style="background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 20px; font-size: 10px; font-weight: bold;">
                    ${item.paymentMethod}
                  </span>
                </div>
                <h4 style="color: #c2410c; font-size: 16px; font-weight: bold; margin: 0;">${item.description}</h4>
                <p style="color: #9a3412; font-size: 12px; margin: 5px 0 0 0;">
                  Data: ${new Date(item.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div style="text-align: right;">
                <p style="color: #ea580c; font-size: 20px; font-weight: bold; margin: 0;">
                  R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        `).join('')}
        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 20px; border-radius: 15px; text-align: center; color: white; margin-top: 20px;">
          <h4 style="font-size: 20px; font-weight: bold; margin: 0 0 10px 0;">TOTAL PAGO</h4>
          <p style="font-size: 32px; font-weight: bold; margin: 0;">
            R$ ${data.totals.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 50px; text-align: center; padding: 20px; border-top: 2px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          Relatório gerado pelo Sistema RevGold em ${new Date().toLocaleString('pt-BR')}
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">
          © ${new Date().getFullYear()} RevGold - Sistema de Gestão Empresarial
        </p>
      </div>
    `;

    document.body.appendChild(tempContainer);

    // Generate PDF
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add pages if content is too long
    let position = 0;
    const pageHeight = 297; // A4 height in mm
    
    while (position < imgHeight) {
      if (position > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        -position,
        imgWidth,
        imgHeight
      );
      
      position += pageHeight;
    }

    // Save the PDF
    const fileName = `Relatorio_RevGold_${new Date(startDate).toLocaleDateString('pt-BR').replace(/\//g, '-')}_ate_${new Date(endDate).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);

    console.log('✅ Relatório PDF gerado com sucesso:', fileName);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}