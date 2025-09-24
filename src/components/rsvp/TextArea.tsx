'use client';

import React from 'react';
import { FormField } from './FormField';
import { cn } from '@/lib/utils';

interface TextAreaProps {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
}

export function TextArea({
  name,
  label,
  required = false,
  error,
  value = '',
  onChange,
  placeholder,
  maxLength,
  rows = 3,
  className
}: TextAreaProps) {
  return (
    <FormField label={label} required={required} error={error} className={className}>
      <textarea
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={cn(
          "w-full px-3 py-2 border text-charcoal border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical",
          error && "border-red-300 focus:ring-red-500 focus:border-red-500"
        )}
      />
      {maxLength && (
        <p className="text-xs text-gray-500 mt-1">
          {value.length}/{maxLength} caracteres
        </p>
      )}
    </FormField>
  );
}
