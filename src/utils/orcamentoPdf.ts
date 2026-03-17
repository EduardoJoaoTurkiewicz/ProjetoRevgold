import type { Orcamento } from '../types';
import { fmtBRL, fmtDate } from './format';

function buildOrcamentoPdfHtml(orcamento: Orcamento): string {
  const itensRows = orcamento.itens
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">
          <strong style="color:#1e293b;font-size:13px;">${item.nomeProduto}</strong><br/>
          <span style="color:#64748b;font-size:12px;">${item.nomeVariacao}${item.nomeCor ? ` · ${item.nomeCor}` : ''}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;font-size:13px;">
          ${item.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151;font-size:13px;">
          ${fmtBRL(item.valorUnitario)}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#0f766e;font-size:13px;">
          ${fmtBRL(item.subtotal)}
        </td>
      </tr>`
    )
    .join('');

  const hoje = fmtDate(new Date());
  const validadeStr = fmtDate(orcamento.dataValidade);
  const criacaoStr = fmtDate(orcamento.dataCriacao);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Orçamento #${orcamento.numero.toString().padStart(5, '0')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; }
    .page { max-width: 800px; margin: 0 auto; background: #fff; min-height: 100vh; }
    @media print {
      body { background: #fff; }
      .page { max-width: 100%; box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f766e,#059669);padding:36px 40px;color:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.5px;">ORÇAMENTO</h1>
          <p style="font-size:22px;font-weight:600;opacity:0.9;margin-top:4px;">
            #${orcamento.numero.toString().padStart(5, '0')}
          </p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:20px;font-weight:800;">Montreal Tintas</div>
          <div style="opacity:0.85;font-size:13px;margin-top:4px;">A maior indústria de tintas do Paraná</div>
          <div style="opacity:0.75;font-size:12px;margin-top:2px;">Emitido em ${hoje}</div>
        </div>
      </div>
    </div>

    <!-- Info cards -->
    <div style="padding:32px 40px 0;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div style="background:#f0fdf9;border:1px solid #99f6e4;border-radius:12px;padding:18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0f766e;margin-bottom:10px;">
          Dados do Cliente
        </div>
        <div style="font-size:15px;font-weight:700;color:#1e293b;">${orcamento.clienteNome || '—'}</div>
        ${orcamento.vendedor && orcamento.vendedor !== 'Não se aplica' ? `<div style="font-size:13px;color:#475569;margin-top:4px;">Vendedor: <strong>${orcamento.vendedor}</strong></div>` : ''}
      </div>
      <div style="background:#f0fdf9;border:1px solid #99f6e4;border-radius:12px;padding:18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0f766e;margin-bottom:10px;">
          Datas
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;">
            <span style="color:#64748b;">Emissão</span>
            <span style="font-weight:600;color:#1e293b;">${criacaoStr}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;">
            <span style="color:#64748b;">Válido até</span>
            <span style="font-weight:700;color:#0f766e;font-size:14px;">${validadeStr}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Itens -->
    <div style="padding:24px 40px 0;">
      <h3 style="font-size:14px;font-weight:700;color:#374151;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">
        Itens do Orçamento
      </h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#f0fdf9;">
            <th style="padding:12px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#0f766e;border-bottom:2px solid #99f6e4;">Produto</th>
            <th style="padding:12px 14px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#0f766e;border-bottom:2px solid #99f6e4;width:80px;">Qtd</th>
            <th style="padding:12px 14px;text-align:right;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#0f766e;border-bottom:2px solid #99f6e4;width:120px;">Unit.</th>
            <th style="padding:12px 14px;text-align:right;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#0f766e;border-bottom:2px solid #99f6e4;width:120px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itensRows}
        </tbody>
        <tfoot>
          <tr style="background:#0f766e;">
            <td colspan="3" style="padding:14px 14px;text-align:right;font-size:14px;font-weight:700;color:#fff;">
              TOTAL DO ORÇAMENTO
            </td>
            <td style="padding:14px 14px;text-align:right;font-size:18px;font-weight:800;color:#fff;">
              ${fmtBRL(orcamento.valorTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${
      orcamento.observacoes
        ? `<div style="padding:24px 40px 0;">
        <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px;">Observações</div>
          <p style="font-size:13px;color:#374151;line-height:1.6;">${orcamento.observacoes.replace(/\n/g, '<br/>')}</p>
        </div>
      </div>`
        : ''
    }

    <!-- Footer -->
    <div style="padding:32px 40px;margin-top:32px;border-top:2px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div style="font-size:12px;color:#94a3b8;max-width:360px;line-height:1.5;">
        Este orçamento é válido até ${validadeStr}. Os preços podem ser alterados após esta data sem aviso prévio.
        Orçamento gerado eletronicamente — Montreal Tintas.
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#94a3b8;">Status</div>
        <div style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;
          background:${orcamento.status === 'convertido' ? '#dcfce7' : orcamento.status === 'vencido' ? '#fee2e2' : '#fef3c7'};
          color:${orcamento.status === 'convertido' ? '#166534' : orcamento.status === 'vencido' ? '#991b1b' : '#92400e'};">
          ${orcamento.status === 'convertido' ? 'Convertido em Venda' : orcamento.status === 'vencido' ? 'Vencido' : 'Pendente'}
        </div>
      </div>
    </div>
  </div>

  <div class="no-print" style="text-align:center;padding:16px;">
    <button onclick="window.print()" style="padding:10px 24px;background:#0f766e;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
      Imprimir / Salvar PDF
    </button>
  </div>
</body>
</html>`;
}

export function abrirPdfOrcamento(orcamento: Orcamento): void {
  const html = buildOrcamentoPdfHtml(orcamento);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
