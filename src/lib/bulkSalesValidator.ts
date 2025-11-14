const VALID_PAYMENT_METHODS = [
  'dinheiro',
  'pix',
  'cartao_credito',
  'cartao_debito',
  'cheque',
  'boleto',
  'transferencia',
  'acerto',
  'permuta',
];

export interface RowValidationError {
  field: string;
  message: string;
}

export interface ValidatedRow {
  rowNumber: number;
  data: {
    cliente: string;
    data_da_venda: string;
    valor_total: number;
    forma_de_pagamento: string;
    parcelas: number;
    vencimento_inicial: string;
    vendedor: string;
  };
  isValid: boolean;
  errors: RowValidationError[];
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();

  const ddmmyyyyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(date.getTime())) return null;
    return date;
  }

  const yyyymmddMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(date.getTime())) return null;
    return date;
  }

  return null;
}

function isValidDate(dateStr: string): boolean {
  return parseDate(dateStr) !== null;
}

function normalizePaymentMethod(method: string): string | null {
  if (!method || typeof method !== 'string') return null;

  const normalized = method
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

  return VALID_PAYMENT_METHODS.includes(normalized) ? normalized : null;
}

export function validateBulkSalesRows(
  rows: Array<Record<string, any>>
): ValidatedRow[] {
  return rows.map((row, index) => {
    const rowNumber = index + 1;
    const errors: RowValidationError[] = [];

    const cliente = row.cliente || row.CLIENTE || row.Cliente || row.client || row.CLIENT || '';
    const data_da_venda =
      row.data_da_venda || row.DATA_DA_VENDA || row['Data da Venda'] || row.date || row.DATE || '';
    const valor_total = row.valor_total || row.VALOR_TOTAL || row['Valor Total'] || row.value || row.VALUE || '';
    const forma_de_pagamento =
      row.forma_de_pagamento ||
      row.FORMA_DE_PAGAMENTO ||
      row['Forma de Pagamento'] ||
      row.payment_method ||
      row.PAYMENT_METHOD ||
      '';
    const parcelas = row.parcelas || row.PARCELAS || row.Parcelas || row.installments || row.INSTALLMENTS || '1';
    const vencimento_inicial =
      row.vencimento_inicial ||
      row.VENCIMENTO_INICIAL ||
      row['Vencimento Inicial'] ||
      row.first_due_date ||
      row.FIRST_DUE_DATE ||
      '';
    const vendedor = row.vendedor || row.VENDEDOR || row.Vendedor || row.seller || row.SELLER || '';

    if (!cliente || typeof cliente !== 'string' || !cliente.trim()) {
      errors.push({
        field: 'cliente',
        message: 'Cliente é obrigatório e deve ser um texto não vazio',
      });
    }

    if (!data_da_venda || !isValidDate(String(data_da_venda))) {
      errors.push({
        field: 'data_da_venda',
        message: 'Data da venda deve ser uma data válida (DD/MM/YYYY ou YYYY-MM-DD)',
      });
    }

    const numValue = parseFloat(String(valor_total).replace(',', '.'));
    if (isNaN(numValue) || numValue <= 0) {
      errors.push({
        field: 'valor_total',
        message: 'Valor total deve ser um número maior que zero',
      });
    }

    const normalizedMethod = normalizePaymentMethod(String(forma_de_pagamento));
    if (!normalizedMethod) {
      errors.push({
        field: 'forma_de_pagamento',
        message: `Forma de pagamento inválida. Use uma das: ${VALID_PAYMENT_METHODS.join(', ')}`,
      });
    }

    const numInstallments = parseInt(String(parcelas), 10);
    if (isNaN(numInstallments) || numInstallments < 1) {
      errors.push({
        field: 'parcelas',
        message: 'Parcelas deve ser um número inteiro maior ou igual a 1',
      });
    }

    if (!vencimento_inicial || !isValidDate(String(vencimento_inicial))) {
      errors.push({
        field: 'vencimento_inicial',
        message: 'Vencimento inicial deve ser uma data válida (DD/MM/YYYY ou YYYY-MM-DD)',
      });
    }

    if (!vendedor || typeof vendedor !== 'string' || !vendedor.trim()) {
      errors.push({
        field: 'vendedor',
        message: 'Vendedor é obrigatório e deve ser um texto não vazio',
      });
    }

    return {
      rowNumber,
      data: {
        cliente: String(cliente).trim(),
        data_da_venda: String(data_da_venda),
        valor_total: numValue || 0,
        forma_de_pagamento: normalizedMethod || String(forma_de_pagamento),
        parcelas: numInstallments || 1,
        vencimento_inicial: String(vencimento_inicial),
        vendedor: String(vendedor).trim(),
      },
      isValid: errors.length === 0,
      errors,
    };
  });
}

export function hasAnyInvalidRows(validatedRows: ValidatedRow[]): boolean {
  return validatedRows.some((row) => !row.isValid);
}

export function getValidationSummary(validatedRows: ValidatedRow[]) {
  const totalRows = validatedRows.length;
  const validRows = validatedRows.filter((r) => r.isValid).length;
  const invalidRows = totalRows - validRows;

  return {
    totalRows,
    validRows,
    invalidRows,
    hasErrors: invalidRows > 0,
  };
}
