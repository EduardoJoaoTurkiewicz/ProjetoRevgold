import type { ProducaoCompleta } from '../types';

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function imprimirEtiquetas(producao: ProducaoCompleta): void {
  const etiquetasHTML = producao.itens.flatMap(item => {
    const linhas: string[] = [];
    for (let i = 0; i < item.quantidade; i++) {
      const nomeProduto = item.nomeProduto;
      const variacao = item.nomeVariacao;
      const cor = item.nomeCor ? item.nomeCor : '';
      const descricao = [variacao, cor].filter(Boolean).join(' · ');

      linhas.push(`
        <div class="etiqueta">
          <div class="etiqueta-header">
            <img src="${window.location.origin}/LOGO_MONTREAL_TINTAS_A_MAIOR_INDUSTRIA_DE_TINTAS_DO_PARANA-removebg-preview.png" class="logo-img" alt="Montreal Tintas" />
          </div>
          <div class="produto">${nomeProduto}</div>
          <div class="descricao">${descricao}</div>
          <div class="separator"></div>
          <div class="info-row">
            <span class="info-label">LOTE</span>
            <span class="info-value lote">${producao.lote}</span>
          </div>
          <div class="info-row">
            <span class="info-label">FAB.</span>
            <span class="info-value">${formatDateBR(producao.fabricacaoDate)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">VAL.</span>
            <span class="info-value">${formatDateBR(producao.validadeDate)}</span>
          </div>
        </div>
      `);
    }
    return linhas;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Etiquetas – ${producao.lote}</title>
  <style>
    @page {
      size: 70mm 30mm;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #fff;
    }

    .etiqueta {
      width: 70mm;
      height: 30mm;
      padding: 2mm 3mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
    }

    .etiqueta-header {
      display: flex;
      align-items: center;
      gap: 2mm;
    }

    .logo-img {
      height: 8mm;
      width: auto;
      object-fit: contain;
      flex-shrink: 0;
    }

    .produto {
      font-size: 7.5pt;
      font-weight: 900;
      color: #111827;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .descricao {
      font-size: 6pt;
      font-weight: 700;
      color: #1a3a8f;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }

    .separator {
      height: 0.3mm;
      background: #e5e7eb;
      margin: 0.5mm 0;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 1.5mm;
      line-height: 1.2;
    }

    .info-label {
      font-size: 4.5pt;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
      width: 6mm;
      flex-shrink: 0;
    }

    .info-value {
      font-size: 5.5pt;
      font-weight: 800;
      color: #374151;
    }

    .info-value.lote {
      font-family: 'Courier New', monospace;
      color: #1f2937;
      font-size: 5pt;
    }

    @media screen {
      body {
        background: #f3f4f6;
        padding: 10px;
      }
      .etiqueta {
        border: 1px dashed #d1d5db;
        margin-bottom: 6px;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
    }
  </style>
</head>
<body>
  ${etiquetasHTML}
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>
  `;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
