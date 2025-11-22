import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Download, ChevronDown, CheckCircle2, XCircle, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { validateBulkSalesRowsWithSupabase, ValidatedRowWithSupabase, getValidationSummary } from '../../lib/bulkSalesSupabaseValidator';
import { useAppContext } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { formatDateForDisplay, createDateFromInput } from '../../utils/dateUtils';

interface BulkSalesImportModalProps {
  onClose: () => void;
}

interface CreationResult {
  success: boolean;
  rowNumber: number;
  client: string;
  saleId?: string;
  error?: string;
}

interface RawRowData {
  [key: string]: any;
}

const XLSX_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const REQUIRED_FIELDS = ['cliente', 'data_da_venda', 'valor_total', 'forma_de_pagamento', 'parcelas', 'vencimento_inicial', 'vendedor'];

const SUGGESTED_COLUMNS = [
  { name: 'descricao', description: 'Product or service description' },
  { name: 'observacoes', description: 'General observations or notes' },
  { name: 'telefone', description: 'Customer phone number' },
  { name: 'email', description: 'Customer email address' },
  { name: 'cpf_cnpj', description: 'Customer tax ID' },
  { name: 'endereco', description: 'Customer address' },
  { name: 'comissao_customizada', description: 'Custom commission rate override' },
  { name: 'data_entrega', description: 'Expected delivery date' },
  { name: 'numero_pedido', description: 'Order number or reference' },
  { name: 'categoria_produto', description: 'Product category for reporting' },
  { name: 'desconto', description: 'Discount amount or percentage' },
  { name: 'taxa_adicional', description: 'Additional fees or charges' },
];

export function BulkSalesImportModal({ onClose }: BulkSalesImportModalProps) {
  const { createSale, employees } = useAppContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<RawRowData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedAt, setUploadedAt] = useState<Date | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validatedRows, setValidatedRows] = useState<ValidatedRowWithSupabase[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationRun, setValidationRun] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationResults, setCreationResults] = useState<CreationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const isEmptyCell = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && !value.trim()) return true;
    return false;
  };

  const isRequiredField = (columnName: string): boolean => {
    const normalizedName = columnName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return REQUIRED_FIELDS.some(field => {
      const normalizedField = field.toLowerCase();
      return normalizedName === normalizedField ||
             normalizedName.includes(normalizedField) ||
             normalizedField.includes(normalizedName);
    });
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return {
        valid: false,
        error: 'Arquivo inválido. Por favor, selecione um arquivo .xlsx',
      };
    }

    if (!XLSX_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de arquivo inválido. O arquivo deve ser um Excel válido (.xlsx)',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Arquivo muito grande. O tamanho máximo permitido é ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
      };
    }

    return { valid: true };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validation = validateFile(file);

      if (validation.valid) {
        setSelectedFile(file);
        setError(null);
        processExcelFile(file);
      } else {
        setSelectedFile(null);
        setError(validation.error || 'Erro ao validar arquivo');
        setRawData([]);
        setColumns([]);
      }
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validation = validateFile(file);

      if (validation.valid) {
        setSelectedFile(file);
        setError(null);
        processExcelFile(file);
      } else {
        setSelectedFile(null);
        setError(validation.error || 'Erro ao validar arquivo');
        setRawData([]);
        setColumns([]);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    setRawData([]);
    setColumns([]);
    setUploadedAt(null);
    setValidatedRows([]);
    setValidationRun(false);
  };

  const handleValidate = async () => {
    if (rawData.length === 0) return;

    try {
      setIsValidating(true);
      const validated = await validateBulkSalesRowsWithSupabase(rawData);
      setValidatedRows(validated);
      setValidationRun(true);
    } catch (err) {
      setError('Erro ao validar dados: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setIsValidating(false);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!worksheet) {
        setError('Arquivo não contém dados válidos');
        setIsProcessing(false);
        return;
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setError('O arquivo não contém linhas de dados');
        setIsProcessing(false);
        return;
      }

      const extractedColumns = Object.keys(jsonData[0] || {});
      setColumns(extractedColumns);
      setRawData(jsonData);
      setUploadedAt(new Date());
    } catch (err) {
      setError('Erro ao processar arquivo: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      setRawData([]);
      setColumns([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getEmployeeIdByName = (name: string): string | undefined => {
    const employee = employees.find(emp => emp.name.toLowerCase().trim() === name.toLowerCase().trim() && emp.isSeller);
    return employee?.id;
  };

  const parseDateDDMMYYYY = (dateStr: string): string | null => {
    if (!dateStr) return null;

    const trimmed = String(dateStr).trim();
    const ddmmyyyyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);

    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isNaN(dateObj.getTime())) return null;

      const yearStr = dateObj.getFullYear();
      const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dayStr = String(dateObj.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    }

    const yyyymmddMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isNaN(dateObj.getTime())) return null;

      const yearStr = dateObj.getFullYear();
      const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dayStr = String(dateObj.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    }

    return null;
  };

  const calculateDueDate = (firstDueDate: string, installmentNumber: number, interval: number): string => {
    const dateStr = parseDateDDMMYYYY(firstDueDate);
    if (!dateStr) return firstDueDate;

    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;

    const dueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    dueDate.setDate(dueDate.getDate() + (installmentNumber - 1) * interval);

    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const transformRowToSale = (validatedRow: ValidatedRowWithSupabase, bulkId: string, fileName: string) => {
    const { data } = validatedRow;
    const installmentInterval = 30;
    const sellerId = getEmployeeIdByName(data.vendedor);
    const saleDate = parseDateDDMMYYYY(data.data_da_venda) || new Date().toISOString().split('T')[0];
    const firstDueDate = parseDateDDMMYYYY(data.vencimento_inicial) || saleDate;

    const paymentMethod = data.forma_de_pagamento;
    const totalValue = data.valor_total;
    const numInstallments = data.parcelas;

    const paymentMethods = [{
      type: paymentMethod,
      amount: totalValue,
      installments: numInstallments,
      installmentValue: numInstallments > 1 ? totalValue / numInstallments : totalValue,
      installmentInterval: installmentInterval,
      firstInstallmentDate: firstDueDate,
      startDate: saleDate
    }];

    const receivedAmount = ['dinheiro', 'pix'].includes(paymentMethod) ? totalValue : 0;
    const pendingAmount = totalValue - receivedAmount;

    const sale = {
      client: data.cliente,
      date: saleDate,
      sellerId: sellerId,
      products: null,
      totalValue: totalValue,
      paymentMethods: paymentMethods,
      receivedAmount: receivedAmount,
      pendingAmount: pendingAmount,
      status: receivedAmount >= totalValue ? 'pago' : (receivedAmount > 0 ? 'parcial' : 'pendente'),
      customCommissionRate: 5,
      observations: `Importado em lote via arquivo Excel`,
      bulk_insert_id: bulkId,
      origin_file_name: fileName
    };

    return sale;
  };

  const handleBulkSalesCreation = async () => {
    if (!validatedRows.some(r => r.isValid)) {
      alert('Nenhuma venda válida para criar');
      return;
    }

    setIsCreating(true);
    setCreationResults([]);
    setCreationProgress(0);

    const validSales = validatedRows.filter(r => r.isValid);
    const bulkId = uuidv4();
    const fileName = selectedFile?.name || 'vendas_em_lote';
    const results: CreationResult[] = [];

    for (let i = 0; i < validSales.length; i++) {
      const validatedRow = validSales[i];

      try {
        const saleData = transformRowToSale(validatedRow, bulkId, fileName);
        await createSale(saleData);

        results.push({
          success: true,
          rowNumber: validatedRow.rowNumber,
          client: validatedRow.data.cliente,
          saleId: undefined
        });

        setCreationProgress(((i + 1) / validSales.length) * 100);
      } catch (err: any) {
        results.push({
          success: false,
          rowNumber: validatedRow.rowNumber,
          client: validatedRow.data.cliente,
          error: err?.message || 'Erro ao criar venda'
        });

        setCreationProgress(((i + 1) / validSales.length) * 100);
      }
    }

    setCreationResults(results);
    setShowResults(true);
    setIsCreating(false);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        cliente: 'Exemplo Cliente 1',
        data_da_venda: '15/11/2024',
        valor_total: 1500.50,
        forma_de_pagamento: 'cartao_credito',
        parcelas: 3,
        vencimento_inicial: '15/12/2024',
        descricao: 'Produtos vendidos',
        vendedor: 'João Silva',
        observacoes: 'Exemplo de observação'
      },
      {
        cliente: 'Exemplo Cliente 2',
        data_da_venda: '16/11/2024',
        valor_total: 2500.00,
        forma_de_pagamento: 'pix',
        parcelas: 1,
        vencimento_inicial: '16/11/2024',
        descricao: 'Serviços prestados',
        vendedor: 'Maria Santos',
        observacoes: ''
      },
      {
        cliente: 'Exemplo Cliente 3',
        data_da_venda: '17/11/2024',
        valor_total: 800.75,
        forma_de_pagamento: 'dinheiro',
        parcelas: 1,
        vencimento_inicial: '17/11/2024',
        descricao: 'Venda de produtos',
        vendedor: 'Pedro Costa',
        observacoes: 'Cliente preferencial'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');

    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 25 }
    ];

    XLSX.writeFile(workbook, 'modelo_vendas.xlsx');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm revgold-animate-fade-in">
      <div className="bg-white rounded-3xl max-w-6xl w-full modern-shadow-xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-700 modern-shadow-xl">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Importação de Vendas em Massa</h2>
                <p className="text-slate-600 text-sm mt-1">Visualize múltiplas vendas de uma vez usando um arquivo Excel</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Creation Progress Modal */}
          {isCreating && (
            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-start gap-3">
              <div className="w-5 h-5 text-blue-600 animate-spin flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-full h-full border-2 border-blue-200 border-t-blue-600 rounded-full" />
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-blue-900">Criando vendas em lote</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Progresso: {Math.round(creationProgress)}%
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${creationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* File Upload Area */}
          <div className="mb-8">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                error
                  ? 'border-red-300 bg-red-50 shadow-lg shadow-red-100'
                  : dragActive
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 shadow-md hover:shadow-lg'
              }`}
            >
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Upload arquivo Excel"
              />

              {!selectedFile ? (
                <div className="flex flex-col items-center gap-4">
                  <div className={`p-4 rounded-full ${error ? 'bg-red-100' : 'bg-blue-100'}`}>
                    <FileSpreadsheet className={`w-8 h-8 ${error ? 'text-red-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      Selecione ou arraste um arquivo .xlsx
                    </h3>
                    <p className="text-sm text-slate-600">
                      Apenas arquivos Excel (.xlsx) são suportados. Máximo 10MB.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary flex items-center gap-2 mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = e.currentTarget.parentElement?.parentElement?.querySelector(
                        'input[type="file"]'
                      ) as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    Selecionar Arquivo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-green-100">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Arquivo selecionado
                    </h3>
                    <p className="text-sm text-slate-600">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    {uploadedAt && (
                      <p className="text-xs text-slate-500 mt-1">
                        Carregado em: {uploadedAt.toLocaleTimeString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-sm text-red-600 hover:text-red-800 font-semibold mt-2"
                  >
                    Remover arquivo
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3 shadow-md revgold-animate-slide-up">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Erro na leitura do arquivo</h4>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-center gap-3 shadow-md revgold-animate-slide-up">
                <div className="w-5 h-5 text-blue-600 animate-spin flex items-center justify-center">
                  <div className="w-full h-full border-2 border-blue-200 border-t-blue-600 rounded-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Lendo arquivo</h4>
                  <p className="text-sm text-blue-800">Extraindo dados do Excel...</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-5 bg-blue-50 rounded-2xl border border-blue-200 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-blue-900">Instruções de Formato</h4>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold text-sm hover:shadow-md hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  Baixar Modelo
                </button>
              </div>
              <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                <li>O arquivo deve estar em formato .xlsx (Excel)</li>
                <li>Tamanho máximo: 10MB</li>
                <li>A primeira linha deve conter os cabeçalhos das colunas</li>
                <li>Colunas obrigatórias: Cliente, Data da Venda, Valor Total, Forma de Pagamento, Parcelas, Vencimento Inicial, Vendedor</li>
                <li>As datas devem estar no formato DD/MM/YYYY</li>
                <li>Os valores devem usar ponto (.) como separador decimal</li>
              </ul>
            </div>
          </div>

          {/* Data Preview Table */}
          {rawData.length > 0 && (
            <div className="mb-8 revgold-animate-slide-up">
              {/* File Metadata */}
              <div className="mb-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-md">
                <h4 className="font-bold text-slate-900 mb-4">Informações do Arquivo</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600">Arquivo</p>
                    <p className="text-lg font-bold text-slate-900 mt-2 truncate">{selectedFile?.name}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600">Total de Linhas</p>
                    <p className="text-lg font-bold text-slate-900 mt-2">{rawData.length}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600">Total de Colunas</p>
                    <p className="text-lg font-bold text-slate-900 mt-2">{columns.length}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600">Carregado em</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">{uploadedAt?.toLocaleTimeString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mb-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-3">Legenda</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-yellow-800">
                    <div className="w-4 h-4 bg-yellow-300 rounded border border-yellow-400" />
                    <span>Campos obrigatórios vazios</span>
                  </div>
                  {validationRun && (
                    <div className="flex items-center gap-2 text-sm text-red-800">
                      <div className="w-4 h-4 bg-red-300 rounded border border-red-400" />
                      <span>Linhas com erros de validação</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Summary */}
              {validationRun && (
                <div className="mb-6 p-4 rounded-2xl border-2">
                  {validatedRows && validatedRows.some(r => !r.isValid) ? (
                    <div className="bg-red-50 border-red-200">
                      <div className="flex items-center gap-3 mb-3">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-red-900">Validação com Erros</h4>
                          <p className="text-sm text-red-800 mt-1">
                            {getValidationSummary(validatedRows).invalidRows} de {getValidationSummary(validatedRows).totalRows} linhas contêm erros
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-green-900">Validação Bem-Sucedida</h4>
                          <p className="text-sm text-green-800 mt-1">
                            Todos os {getValidationSummary(validatedRows).totalRows} dados estão válidos
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Data Table */}
              <h4 className="font-bold text-slate-900 mb-4">Dados do Arquivo</h4>
              <div className="max-h-96 overflow-auto border border-slate-200 rounded-2xl shadow-md revgold-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 bg-slate-100 sticky left-0 z-10">#</th>
                      {columns.map((column) => (
                        <th
                          key={column}
                          className={`px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap ${
                            isRequiredField(column) ? 'bg-yellow-50 text-yellow-900' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {column}
                            {isRequiredField(column) && (
                              <span className="text-red-500 font-bold" title="Campo obrigatório">*</span>
                            )}
                          </div>
                        </th>
                      ))}
                      {validationRun && <th className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap w-64 bg-slate-100">Erros</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.map((row, rowIdx) => {
                      const validatedRow = validatedRows[rowIdx];
                      const hasErrors = validatedRow && !validatedRow.isValid;
                      const rowClass = hasErrors ? 'bg-red-100' : '';

                      return (
                        <tr key={rowIdx} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${rowClass}`}>
                          <td className={`px-4 py-3 font-semibold text-slate-700 sticky left-0 z-10 ${hasErrors ? 'bg-red-200' : 'bg-slate-50'}`}>
                            {rowIdx + 2}
                          </td>
                          {columns.map((column) => {
                            const cellValue = row[column];
                            const isEmpty = isEmptyCell(cellValue);
                            const isRequired = isRequiredField(column);
                            const shouldHighlight = isEmpty && isRequired;
                            const fieldError = validatedRow?.errors.find(e => e.field === column);

                            return (
                              <td
                                key={`${rowIdx}-${column}`}
                                className={`px-4 py-3 text-slate-700 whitespace-nowrap ${
                                  shouldHighlight ? 'bg-yellow-300 font-semibold' : ''
                                } ${fieldError ? 'bg-red-200 font-semibold' : ''}`}
                                title={fieldError?.message}
                              >
                                {cellValue !== null && cellValue !== undefined ? String(cellValue) : ''}
                              </td>
                            );
                          })}
                          {validationRun && (
                            <td className="px-4 py-3 text-sm text-red-700 w-64">
                              {hasErrors && (
                                <div className="space-y-1">
                                  {validatedRow.errors.map((err, idx) => (
                                    <div key={idx} className="text-xs">
                                      <strong>{err.field}:</strong> {err.message}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Suggested Columns Panel */}
          {rawData.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="w-full p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 hover:shadow-md transition-shadow duration-300 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-emerald-900">Colunas Sugeridas para Aprimoramento</h4>
                  <p className="text-sm text-emerald-700">({SUGGESTED_COLUMNS.length} sugestões)</p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-emerald-900 transition-transform duration-300 ${
                    showSuggestions ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {showSuggestions && (
                <div className="mt-4 p-6 bg-emerald-50 rounded-2xl border border-emerald-200 revgold-animate-slide-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SUGGESTED_COLUMNS.map((col) => (
                      <div key={col.name} className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                        <h5 className="font-bold text-emerald-900 text-sm">{col.name}</h5>
                        <p className="text-xs text-slate-600 mt-2">{col.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          {!showResults && (
            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
              <button
                onClick={onClose}
                className="btn-secondary rounded-2xl transition-all duration-300 hover:shadow-md"
                disabled={isCreating}
              >
                Fechar
              </button>
              {rawData.length > 0 && !validationRun && (
                <button
                  onClick={handleValidate}
                  disabled={isValidating || isCreating}
                  className="px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isValidating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Validando...
                    </>
                  ) : (
                    'Validar'
                  )}
                </button>
              )}
              {validationRun && (
                <button
                  onClick={handleValidate}
                  disabled={isValidating || isCreating}
                  className="px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isValidating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Revalidando...
                    </>
                  ) : (
                    'Revalidar'
                  )}
                </button>
              )}
              <button
                disabled={!validationRun || validatedRows.some(r => !r.isValid) || isCreating}
                onClick={handleBulkSalesCreation}
                title={!validationRun ? "Execute a validação primeiro" : validatedRows.some(r => !r.isValid) ? "Existem linhas com erros de validação" : "Criar todas as vendas válidas"}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                  validationRun && !validatedRows.some(r => !r.isValid) && !isCreating
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                {isCreating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar vendas'
                )}
              </button>
            </div>
          )}

          {/* Results Modal */}
          {showResults && (
            <div className="space-y-6 border-t border-slate-200 pt-6">
              <div className="p-6 rounded-2xl" style={{
                backgroundColor: creationResults.some(r => !r.success) ? '#fef2f2' : '#f0fdf4',
                borderColor: creationResults.some(r => !r.success) ? '#fecaca' : '#bbf7d0',
                borderWidth: '2px'
              }}>
                <div className="flex items-start gap-4">
                  {creationResults.some(r => !r.success) ? (
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-grow">
                    <h4 className={`font-bold text-lg ${creationResults.some(r => !r.success) ? 'text-red-900' : 'text-green-900'}`}>
                      {creationResults.some(r => !r.success) ? 'Criação concluída com erros' : 'Todas as vendas foram criadas com sucesso!'}
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-slate-600">Total de vendas</p>
                        <p className="text-2xl font-bold text-slate-900">{creationResults.length}</p>
                      </div>
                      <div>
                        <p className="text-green-600">Criadas com sucesso</p>
                        <p className="text-2xl font-bold text-green-700">{creationResults.filter(r => r.success).length}</p>
                      </div>
                      {creationResults.some(r => !r.success) && (
                        <div>
                          <p className="text-red-600">Com erros</p>
                          <p className="text-2xl font-bold text-red-700">{creationResults.filter(r => !r.success).length}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {creationResults.some(r => !r.success) && (
                <div className="p-6 bg-red-50 rounded-2xl border border-red-200">
                  <h5 className="font-bold text-red-900 mb-4">Vendas com erro:</h5>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {creationResults.filter(r => !r.success).map((result, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-red-100">
                        <p className="font-semibold text-red-900">Linha {result.rowNumber}: {result.client}</p>
                        <p className="text-sm text-red-700 mt-1">{result.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowResults(false);
                    clearFile();
                    onClose();
                  }}
                  className="btn-primary rounded-2xl"
                >
                  Concluído
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
