'use client';

import React from 'react';
import { FormField } from './FormField';
import { cn } from '@/lib/utils';

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  options: CheckboxOption[];
  value?: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function CheckboxGroup({
  name,
  label,
  required = false,
  error,
  options,
  value = [],
  onChange,
  className
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

  return (
    <FormField label={label} required={required} error={error} className={className}>
      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
              value.includes(option.value)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </FormField>
  );
}
