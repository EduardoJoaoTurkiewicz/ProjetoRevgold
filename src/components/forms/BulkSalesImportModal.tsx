import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface BulkSalesImportModalProps {
  onClose: () => void;
}

const XLSX_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function BulkSalesImportModal({ onClose }: BulkSalesImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Fechar
            </button>
            <button
              disabled={!selectedFile}
              className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                selectedFile
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer modern-shadow-lg'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              Processar arquivo
            </button>
            <button
              disabled
              className="px-6 py-2 rounded-xl font-semibold bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
            >
              Criar vendas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
