import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { validateBulkSalesRows, hasAnyInvalidRows, getValidationSummary, ValidatedRow } from '../../lib/bulkSalesValidator';
import { useAppContext } from '../../context/AppContext';
import { Sale, PaymentMethod } from '../../types';
import { parseInputDate } from '../../utils/dateUtils';
import { safeNumber } from '../../utils/numberUtils';

interface BulkSalesImportModalProps {
  onClose: () => void;
}

interface CreationResult {
  rowNumber: number;
  clientName: string;
  paymentType: string;
  totalValue: number;
  success: boolean;
  saleId?: string;
  error?: string;
  timestamp: number;
}

interface BulkCreationStats {
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: CreationResult[];
  totalValueProcessed: number;
  processingTimeMs: number;
}

const XLSX_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function BulkSalesImportModal({ onClose }: BulkSalesImportModalProps) {
  const { createSale, employees } = useAppContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState({ current: 0, total: 0 });
  const [creationStats, setCreationStats] = useState<BulkCreationStats | null>(null);

  const isValidXlsxFile = (file: File): boolean => {
    const hasValidExtension = file.name.toLowerCase().endsWith('.xlsx');
    const hasValidMimeType = XLSX_MIME_TYPES.includes(file.type);
    return hasValidExtension && hasValidMimeType;
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
      } else {
        setSelectedFile(null);
        setError(validation.error || 'Erro ao validar arquivo');
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
      } else {
        setSelectedFile(null);
        setError(validation.error || 'Erro ao validar arquivo');
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    setValidatedRows([]);
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

      const validated = validateBulkSalesRows(jsonData);
      setValidatedRows(validated);
    } catch (err) {
      setError('Erro ao processar arquivo: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      setValidatedRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessClick = async () => {
    if (selectedFile) {
      await processExcelFile(selectedFile);
    }
  };

  const convertExcelDateToISOString = (excelDateStr: string): string => {
    const trimmed = excelDateStr.trim();

    const ddmmyyyyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const yyyymmddMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    return trimmed;
  };

  const findSellerIdByName = (sellerName: string): string | null => {
    if (!sellerName || !sellerName.trim()) return null;
    const seller = employees.find(
      emp => emp.isActive && emp.isSeller && emp.name.toLowerCase() === sellerName.toLowerCase().trim()
    );
    return seller?.id || null;
  };

  const mapValidatedRowToSale = (row: ValidatedRow, bulkMetadata?: { bulk_insert_id: string; origin_file_name: string }): Omit<Sale, 'id' | 'createdAt'> & { bulk_insert_id?: string; origin_file_name?: string } => {
    const totalValue = safeNumber(row.data.valor_total, 0);
    const sellerId = findSellerIdByName(row.data.vendedor);
    const saleDate = convertExcelDateToISOString(row.data.data_da_venda);
    const firstInstallmentDate = convertExcelDateToISOString(row.data.vencimento_inicial);
    const parcelas = safeNumber(row.data.parcelas, 1);
    const installmentInterval = 30;

    const paymentMethod: PaymentMethod = {
      type: row.data.forma_de_pagamento as PaymentMethod['type'],
      amount: totalValue,
      installments: parcelas,
      installmentInterval: installmentInterval,
      firstInstallmentDate: firstInstallmentDate,
    };

    if (parcelas > 1) {
      paymentMethod.installmentValue = totalValue / parcelas;
    }

    const receivedAmount =
      row.data.forma_de_pagamento === 'dinheiro' ||
      row.data.forma_de_pagamento === 'pix' ||
      row.data.forma_de_pagamento === 'cartao_debito'
        ? totalValue
        : row.data.forma_de_pagamento === 'cartao_credito' && parcelas === 1
          ? totalValue
          : 0;

    const pendingAmount = totalValue - receivedAmount;

    const sale: Omit<Sale, 'id' | 'createdAt'> & { bulk_insert_id?: string; origin_file_name?: string } = {
      date: saleDate,
      client: row.data.cliente,
      sellerId: sellerId,
      products: 'Produtos vendidos',
      observations: null,
      totalValue: totalValue,
      paymentMethods: [paymentMethod],
      receivedAmount: receivedAmount,
      pendingAmount: pendingAmount,
      status: pendingAmount <= 0.01 ? 'pago' : receivedAmount > 0 ? 'parcial' : 'pendente',
      custom_commission_rate: 5,
    };

    if (bulkMetadata) {
      sale.bulk_insert_id = bulkMetadata.bulk_insert_id;
      sale.origin_file_name = bulkMetadata.origin_file_name;
    }

    return sale;
  };

  const handleBulkCreateSales = async () => {
    if (validatedRows.length === 0 || hasAnyInvalidRows(validatedRows)) {
      alert('Selecione apenas linhas válidas para criar as vendas.');
      return;
    }

    const validRowsOnly = validatedRows.filter(row => row.isValid);
    if (validRowsOnly.length === 0) {
      alert('Nenhuma linha válida encontrada.');
      return;
    }

    const totalValue = validRowsOnly.reduce((sum, row) => sum + row.data.valor_total, 0);
    const proceed = window.confirm(
      `Você está prestes a criar ${validRowsOnly.length} venda(s) totalizando R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.\n\nDeseja continuar?`
    );

    if (!proceed) return;

    const startTime = Date.now();
    setIsCreating(true);
    setCreationProgress({ current: 0, total: validRowsOnly.length });
    const results: CreationResult[] = [];

    const bulkInsertId = uuidv4();
    const originFileName = selectedFile?.name || 'arquivo_importacao';
    const bulkMetadata = { bulk_insert_id: bulkInsertId, origin_file_name: originFileName };

    console.log(`🔄 Starting bulk import with batch ID: ${bulkInsertId} from file: ${originFileName}`);

    for (let i = 0; i < validRowsOnly.length; i++) {
      const row = validRowsOnly[i];
      setCreationProgress({ current: i + 1, total: validRowsOnly.length });

      try {
        console.log(`📝 Processing row ${row.rowNumber}: ${row.data.cliente} - ${row.data.forma_de_pagamento} [Batch: ${bulkInsertId}]`);
        const saleData = mapValidatedRowToSale(row, bulkMetadata);
        const result = await createSale(saleData);

        const createdResult: CreationResult = {
          rowNumber: row.rowNumber,
          clientName: row.data.cliente,
          paymentType: row.data.forma_de_pagamento,
          totalValue: row.data.valor_total,
          success: true,
          saleId: typeof result === 'string' ? result : result?.id,
          timestamp: Date.now(),
        };

        results.push(createdResult);
        console.log(`✅ Sale created successfully (row ${row.rowNumber}): ${createdResult.saleId}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error(`❌ Error creating sale for row ${row.rowNumber} (${row.data.cliente}):`, err);

        results.push({
          rowNumber: row.rowNumber,
          clientName: row.data.cliente,
          paymentType: row.data.forma_de_pagamento,
          totalValue: row.data.valor_total,
          success: false,
          error: errorMessage,
          timestamp: Date.now(),
        });
      }
    }

    const processingTimeMs = Date.now() - startTime;
    setIsCreating(false);

    const successfulResults = results.filter(r => r.success);
    const stats: BulkCreationStats = {
      totalRows: validRowsOnly.length,
      successCount: successfulResults.length,
      failureCount: results.filter(r => !r.success).length,
      results,
      totalValueProcessed: successfulResults.reduce((sum, r) => sum + r.totalValue, 0),
      processingTimeMs,
    };

    console.log(`✅ Bulk import completed with batch ID: ${bulkInsertId} - ${successfulResults.length}/${validRowsOnly.length} successful`);
    setCreationStats(stats);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full modern-shadow-xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-700 modern-shadow-xl">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Importação de Vendas em Massa</h2>
                <p className="text-slate-600 text-sm mt-1">Importe múltiplas vendas de uma vez usando um arquivo Excel</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* File Upload Area */}
          <div className="mb-8">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                error
                  ? 'border-red-300 bg-red-50'
                  : dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
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
              <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Erro na validação</h4>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3">Instruções de Formato</h4>
              <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                <li>O arquivo deve estar em formato .xlsx (Excel)</li>
                <li>Tamanho máximo: 10MB</li>
                <li>A primeira linha deve conter os cabeçalhos das colunas</li>
                <li>Colunas obrigatórias: Data, Cliente, Valor Total, Método de Pagamento</li>
                <li>As datas devem estar no formato DD/MM/YYYY</li>
                <li>Os valores devem usar ponto (.) como separador decimal</li>
              </ul>
            </div>
          </div>

          {/* Preview Table */}
          {validatedRows.length > 0 && (
            <div className="mb-8">
              {(() => {
                const summary = getValidationSummary(validatedRows);
                return (
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-3">Resumo de Validação</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Total de Linhas</p>
                        <p className="text-2xl font-bold text-slate-900">{summary.totalRows}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Válidas</p>
                        <p className="text-2xl font-bold text-green-600">{summary.validRows}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Inválidas</p>
                        <p className="text-2xl font-bold text-red-600">{summary.invalidRows}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <h4 className="font-bold text-slate-900 mb-4">Prévia dos Dados</h4>
              <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Cliente</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Data Venda</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Valor</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Pagamento</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Parcelas</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Vencimento</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Vendedor</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedRows.map((row) => (
                      <React.Fragment key={row.rowNumber}>
                        <tr
                          className={`border-b border-slate-200 transition-colors ${
                            row.isValid ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
                          }`}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-700">{row.rowNumber}</td>
                          <td className="px-4 py-3 text-slate-700">{row.data.cliente}</td>
                          <td className="px-4 py-3 text-slate-700">{row.data.data_da_venda}</td>
                          <td className="px-4 py-3 text-right text-slate-700">
                            R$ {row.data.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{row.data.forma_de_pagamento}</td>
                          <td className="px-4 py-3 text-center text-slate-700">{row.data.parcelas}</td>
                          <td className="px-4 py-3 text-slate-700">{row.data.vencimento_inicial}</td>
                          <td className="px-4 py-3 text-slate-700">{row.data.vendedor}</td>
                          <td className="px-4 py-3 text-center">
                            {row.isValid ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                        {!row.isValid && row.errors.length > 0 && (
                          <tr className="bg-red-50 border-b border-red-200">
                            <td colSpan={9} className="px-4 py-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-semibold text-red-900 mb-2">Erros encontrados:</p>
                                  <ul className="space-y-1 text-sm text-red-800">
                                    {row.errors.map((err, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-red-600">•</span>
                                        <span>
                                          <strong>{err.field}:</strong> {err.message}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasAnyInvalidRows(validatedRows) && (
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Validação não passou</h4>
                    <p className="text-sm text-red-800 mt-1">
                      Corrija os erros acima antes de criar as vendas. O botão "Criar vendas" será ativado quando todos os
                      dados forem válidos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Creation Progress */}
          {isCreating && (
            <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                <div>
                  <h4 className="font-bold text-blue-900">Criando vendas...</h4>
                  <p className="text-sm text-blue-700">
                    Venda {creationProgress.current} de {creationProgress.total}
                  </p>
                </div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(creationProgress.current / creationProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Results Modal */}
          {creationStats && !isCreating && (
            <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div className="mb-6">
                <h4 className="text-2xl font-bold text-slate-900 mb-6">Resumo da Criação em Massa</h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
                    <p className="text-slate-600 text-xs font-semibold mb-2 uppercase">Total Processado</p>
                    <p className="text-3xl font-bold text-slate-900">{creationStats.totalRows}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                    <p className="text-green-700 text-xs font-semibold mb-2 uppercase">Bem-sucedidas</p>
                    <p className="text-3xl font-bold text-green-600">{creationStats.successCount}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                    <p className="text-red-700 text-xs font-semibold mb-2 uppercase">Falhas</p>
                    <p className="text-3xl font-bold text-red-600">{creationStats.failureCount}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <p className="text-blue-700 text-xs font-semibold mb-2 uppercase">Taxa Sucesso</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {((creationStats.successCount / creationStats.totalRows) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 font-semibold mb-1">Valor Total Criado:</p>
                      <p className="text-lg font-bold text-green-700">
                        R$ {creationStats.totalValueProcessed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-semibold mb-1">Tempo de Processamento:</p>
                      <p className="text-lg font-bold text-slate-900">
                        {(creationStats.processingTimeMs / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                </div>

                {creationStats.successCount > 0 && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 max-h-64 overflow-y-auto">
                    <h5 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                      <span className="text-lg">✓</span> Vendas Criadas com Sucesso:
                    </h5>
                    <ul className="space-y-2 text-sm">
                      {creationStats.results
                        .filter(r => r.success)
                        .map((result, idx) => (
                          <li key={idx} className="text-green-800 flex items-start gap-3">
                            <span className="font-bold flex-shrink-0 text-green-600">#{result.rowNumber}</span>
                            <div className="flex-1">
                              <p className="font-semibold">{result.clientName}</p>
                              <p className="text-xs text-green-700">
                                {result.paymentType} - R$ {result.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ID: {result.saleId}
                              </p>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {creationStats.failureCount > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 max-h-64 overflow-y-auto">
                    <h5 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                      <span className="text-lg">✕</span> Erros Detectados:
                    </h5>
                    <ul className="space-y-3 text-sm">
                      {creationStats.results
                        .filter(r => !r.success)
                        .map((result, idx) => (
                          <li key={idx} className="text-red-800 flex items-start gap-3 p-3 bg-white rounded border border-red-200">
                            <span className="font-bold flex-shrink-0 text-red-600">#{result.rowNumber}</span>
                            <div className="flex-1">
                              <p className="font-semibold">{result.clientName}</p>
                              <p className="text-xs text-red-700 mt-1">{result.paymentType}</p>
                              <p className="text-xs text-red-600 mt-1 font-mono bg-red-100 p-2 rounded mt-2 break-words">
                                {result.error}
                              </p>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
            <button
              onClick={() => {
                if (creationStats?.successCount === creationStats?.totalRows) {
                  onClose();
                } else {
                  setCreationStats(null);
                  setValidatedRows([]);
                  setSelectedFile(null);
                  setError(null);
                }
              }}
              className="btn-secondary"
              disabled={isCreating}
            >
              {creationStats?.successCount === creationStats?.totalRows ? 'Fechar' : 'Começar Novamente'}
            </button>
            <button
              onClick={handleProcessClick}
              disabled={!selectedFile || isProcessing || isCreating || creationStats !== null}
              className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                selectedFile && !isProcessing && !isCreating && creationStats === null
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer modern-shadow-lg'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              {isProcessing ? 'Processando...' : 'Processar arquivo'}
            </button>
            <button
              onClick={handleBulkCreateSales}
              disabled={validatedRows.length === 0 || hasAnyInvalidRows(validatedRows) || isCreating || creationStats !== null}
              className={`px-6 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                validatedRows.length > 0 && !hasAnyInvalidRows(validatedRows) && !isCreating && creationStats === null
                  ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer modern-shadow-lg'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              {isCreating && <Loader className="w-4 h-4 animate-spin" />}
              Criar vendas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
