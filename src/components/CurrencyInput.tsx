import React, { useRef, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
  id?: string;
  name?: string;
  'aria-label'?: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function CurrencyInput({
  value,
  onChange,
  className = '',
  placeholder = '0,00',
  required = false,
  disabled = false,
  readOnly = false,
  min,
  max,
  id,
  name,
  'aria-label': ariaLabel,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayValue = value === 0 ? '' : formatCurrency(Math.round(value * 100));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return;

    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedKeys.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) return;

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return;

    const raw = e.target.value.replace(/\D/g, '');
    const cents = parseInt(raw || '0', 10);
    const newValue = cents / 100;

    if (max !== undefined && newValue > max) return;
    if (min !== undefined && newValue < min && raw.length > 0) return;

    onChange(newValue);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    const cents = parseInt(pasted || '0', 10);
    const newValue = cents / 100;
    if (max !== undefined && newValue > max) return;
    onChange(newValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      if (inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      id={id}
      name={name}
      value={displayValue}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={handleFocus}
      className={className}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      aria-label={ariaLabel}
    />
  );
}
