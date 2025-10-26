import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSearch,
  onClear
}: DateRangePickerProps) {
  const [startDateError, setStartDateError] = useState<string>('');
  const [endDateError, setEndDateError] = useState<string>('');

  const formatDateInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    onStartDateChange(formatted);
    setStartDateError('');
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    onEndDateChange(formatted);
    setEndDateError('');
  };

  const parseBrazilianDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.length !== 10) return null;

    const [day, month, year] = dateStr.split('/').map(Number);

    if (!day || !month || !year || year < 1900 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    return new Date(year, month - 1, day);
  };

  const validateAndSearch = () => {
    let hasError = false;

    if (!startDate || startDate.length !== 10) {
      setStartDateError('Data inicial inválida');
      hasError = true;
    }

    if (!endDate || endDate.length !== 10) {
      setEndDateError('Data final inválida');
      hasError = true;
    }

    if (hasError) return;

    const start = parseBrazilianDate(startDate);
    const end = parseBrazilianDate(endDate);

    if (!start) {
      setStartDateError('Data inicial inválida');
      hasError = true;
    }

    if (!end) {
      setEndDateError('Data final inválida');
      hasError = true;
    }

    if (hasError) return;

    if (start! > end!) {
      setStartDateError('Data inicial deve ser menor que a final');
      setEndDateError('Data final deve ser maior que a inicial');
      return;
    }

    const daysDiff = Math.ceil((end!.getTime() - start!.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      setStartDateError('Período máximo de 365 dias');
      setEndDateError('Período máximo de 365 dias');
      return;
    }

    onSearch();
  };

  const setQuickRange = (days: number) => {
    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + days);

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    onStartDateChange(formatDate(today));
    onEndDateChange(formatDate(end));
    setStartDateError('');
    setEndDateError('');
  };

  const setCurrentMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    onStartDateChange(formatDate(firstDay));
    onEndDateChange(formatDate(lastDay));
    setStartDateError('');
    setEndDateError('');
  };

  return (
    <div className="card modern-shadow-xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Filtrar Vencimentos</h3>
          <p className="text-slate-600">Selecione o período para consultar</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Data Inicial</label>
            <input
              type="text"
              value={startDate}
              onChange={handleStartDateChange}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className={`form-input ${startDateError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {startDateError && (
              <p className="mt-1 text-sm text-red-600 font-semibold">{startDateError}</p>
            )}
          </div>

          <div>
            <label className="form-label">Data Final</label>
            <input
              type="text"
              value={endDate}
              onChange={handleEndDateChange}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className={`form-input ${endDateError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {endDateError && (
              <p className="mt-1 text-sm text-red-600 font-semibold">{endDateError}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setQuickRange(0)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-sm"
          >
            Hoje
          </button>
          <button
            onClick={() => setQuickRange(7)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-sm"
          >
            Próximos 7 dias
          </button>
          <button
            onClick={() => setQuickRange(15)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-sm"
          >
            Próximos 15 dias
          </button>
          <button
            onClick={() => setQuickRange(30)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-sm"
          >
            Próximos 30 dias
          </button>
          <button
            onClick={setCurrentMonth}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-sm"
          >
            Mês Atual
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={validateAndSearch}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Buscar Vencimentos
          </button>
          <button
            onClick={onClear}
            className="px-6 btn-secondary flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}
