import type { Sale, SaleItem } from '../types';

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_credito: 'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
  cheque: 'Cheque',
  boleto: 'Boleto',
  transferencia: 'Transferencia',
  acerto: 'Acerto',
  permuta: 'Permuta',
};

const STATUS_LABELS: Record<string, string> = {
  pago: 'PAGO',
  parcial: 'PARCIAL',
  pendente: 'PENDENTE',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildItemsTable(saleItems: SaleItem[]): string {
  if (!saleItems || saleItems.length === 0) return '';

  const rows = saleItems.map(item => `
    <tr>
      <td>${escapeHtml(item.nomeProduto ?? item.produtoId)}</td>
      <td>${escapeHtml(item.nomeVariacao ?? item.variacaoId)}</td>
      <td>${item.nomeCor ? escapeHtml(item.nomeCor) : '-'}</td>
      <td class="num">${item.quantidade}</td>
      <td class="num">R$ ${formatCurrency(item.valorUnitario)}</td>
      <td class="num bold">R$ ${formatCurrency(item.valorTotal)}</td>
    </tr>
  `).join('');

  return `
    <section class="section">
      <h3 class="section-title">Itens da Venda</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Variacao</th>
            <th>Cor</th>
            <th class="num">Qtd</th>
            <th class="num">Valor Unit.</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function buildPaymentTable(sale: Sale): string {
  const rows = (sale.paymentMethods || []).map(method => {
    const label = PAYMENT_LABELS[method.type] ?? method.type;
    const parcelas = method.installments && method.installments > 1
      ? ` (${method.installments}x)`
      : '';
    return `
      <tr>
        <td>${label}${parcelas}</td>
        <td class="num bold">R$ ${formatCurrency(method.amount)}</td>
      </tr>
    `;
  }).join('');

  return `
    <section class="section">
      <h3 class="section-title">Forma de Pagamento</h3>
      <table class="simple-table">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

export function gerarComprovantePDF(sale: Sale, saleItems?: SaleItem[]): void {
  const saleNumber = sale.id.split('-')[0].toUpperCase();
  const statusLabel = STATUS_LABELS[sale.status] ?? sale.status;
  const statusColor = sale.status === 'pago' ? '#16a34a' : sale.status === 'parcial' ? '#d97706' : '#dc2626';

  const logoHtml = `
    <div class="logo-area">
      <img
        src="/LOGO_MONTREAL_TINTAS_A_MAIOR_INDUSTRIA_DE_TINTAS_DO_PARANA-removebg-preview.png"
        alt="Montreal Tintas"
        class="logo-img"
        onerror="this.style.display='none'; document.getElementById('logo-text').style.display='block';"
      />
      <span id="logo-text" style="display:none" class="logo-fallback">Montreal Tintas</span>
    </div>
  `;

  const productsSection = saleItems && saleItems.length > 0
    ? buildItemsTable(saleItems)
    : (sale.products
        ? `<section class="section"><h3 class="section-title">Produtos</h3><p class="products-text">${escapeHtml(
            typeof sale.products === 'string' ? sale.products : 'Produtos vendidos'
          )}</p></section>`
        : '');

  const observacoesSection = sale.observations
    ? `<section class="section"><h3 class="section-title">Observacoes</h3><p class="obs-text">${escapeHtml(sale.observations)}</p></section>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Comprovante de Venda - ${saleNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #fff;
      color: #1e293b;
      font-size: 13px;
      line-height: 1.5;
    }
    .page {
      max-width: 720px;
      margin: 0 auto;
      padding: 32px 28px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #166534;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .logo-area { display: flex; flex-direction: column; align-items: flex-start; }
    .logo-img { height: 60px; max-width: 220px; object-fit: contain; }
    .logo-fallback { font-size: 22px; font-weight: 800; color: #166534; letter-spacing: -0.5px; }
    .header-right { text-align: right; }
    .comprovante-title { font-size: 20px; font-weight: 700; color: #166534; }
    .sale-number { font-size: 13px; color: #64748b; margin-top: 2px; }
    .status-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 6px;
      color: white;
      background: ${statusColor};
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .info-card h4 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .info-card p { font-size: 14px; font-weight: 600; color: #1e293b; }
    .info-card .sub { font-size: 12px; font-weight: 400; color: #475569; margin-top: 2px; }
    .section { margin-bottom: 20px; }
    .section-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 700;
      color: #166534;
      padding-bottom: 6px;
      border-bottom: 1px solid #dcfce7;
      margin-bottom: 10px;
    }
    .items-table, .simple-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table th, .items-table td,
    .simple-table th, .simple-table td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      text-align: left;
      font-size: 12px;
    }
    .items-table th { background: #f1f5f9; font-weight: 700; color: #334155; }
    .items-table tbody tr:nth-child(even) { background: #f8fafc; }
    .num { text-align: right; }
    .bold { font-weight: 700; }
    .totals-box {
      background: #f0fdf4;
      border: 2px solid #bbf7d0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 13px;
    }
    .totals-row.total-final {
      border-top: 1px solid #86efac;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 800;
      color: #166534;
    }
    .totals-row.received { color: #059669; font-weight: 600; }
    .totals-row.pending { color: #dc2626; font-weight: 600; }
    .products-text {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      color: #334155;
    }
    .obs-text {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 12px;
      color: #78350f;
      font-size: 12px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 24px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 16px; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    ${logoHtml}
    <div class="header-right">
      <div class="comprovante-title">Comprovante de Venda</div>
      <div class="sale-number">Nº ${saleNumber}</div>
      <div class="status-badge">${statusLabel}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <h4>Cliente</h4>
      <p>${escapeHtml(sale.client)}</p>
    </div>
    <div class="info-card">
      <h4>Data da Venda</h4>
      <p>${formatDate(sale.date)}</p>
      ${sale.deliveryDate ? `<p class="sub">Entrega: ${formatDate(sale.deliveryDate)}</p>` : ''}
    </div>
    <div class="info-card">
      <h4>Emitido em</h4>
      <p>${new Date().toLocaleDateString('pt-BR')}</p>
      <p class="sub">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
    <div class="info-card">
      <h4>ID da Venda</h4>
      <p style="font-family:monospace;font-size:11px">${sale.id}</p>
    </div>
  </div>

  ${productsSection}
  ${buildPaymentTable(sale)}

  <div class="totals-box">
    <div class="totals-row total-final">
      <span>Valor Total</span>
      <span>R$ ${formatCurrency(sale.totalValue)}</span>
    </div>
    <div class="totals-row received">
      <span>Valor Recebido</span>
      <span>R$ ${formatCurrency(sale.receivedAmount)}</span>
    </div>
    ${sale.pendingAmount > 0 ? `
    <div class="totals-row pending">
      <span>Valor Pendente</span>
      <span>R$ ${formatCurrency(sale.pendingAmount)}</span>
    </div>` : ''}
  </div>

  ${observacoesSection}

  <div class="footer">
    <p>Montreal Tintas &mdash; Comprovante gerado em ${new Date().toLocaleString('pt-BR')}</p>
    <p style="margin-top:4px">Este documento e apenas para fins informativos.</p>
  </div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=820,height=900');
  if (win) {
    win.onunload = () => URL.revokeObjectURL(url);
  }
}
