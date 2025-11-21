import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Download, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { validateBulkSalesRowsWithSupabase, ValidatedRowWithSupabase, getValidationSummary } from '../../lib/bulkSalesSupabaseValidator';

interface BulkSalesImportModalProps {
  onClose: () => void;
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

          {/* Display-Only Mode Notice */}
          <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Modo de Visualização</h4>
              <p className="text-sm text-blue-800">Este painel é apenas para visualizar seus dados. Nenhum dado será salvo no banco de dados. Para proceder com a criação de vendas, entre em contato com a equipe de administração.</p>
            </div>
          </div>

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
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="btn-secondary rounded-2xl transition-all duration-300 hover:shadow-md"
            >
              Fechar
            </button>
            {rawData.length > 0 && !validationRun && (
              <button
                onClick={handleValidate}
                disabled={isValidating}
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
                disabled={isValidating}
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
              disabled={!validationRun || validatedRows.some(r => !r.isValid)}
              title={validationRun && validatedRows.some(r => !r.isValid) ? "Existem linhas com erros de validação" : "Modo de visualização apenas. A criação de vendas está desativada neste painel."}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                validationRun && !validatedRows.some(r => !r.isValid)
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              Criar vendas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
