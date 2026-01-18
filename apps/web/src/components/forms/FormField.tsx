'use client';

import { ReactNode, forwardRef } from 'react';
import type { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  error?: FieldError | string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, error, required, hint, children }: FormFieldProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 mr-1">*</span>}
      </label>
      {children}
      {hint && !errorMessage && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
      {errorMessage && (
        <p className="text-xs text-red-400">{errorMessage}</p>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
          error ? 'border-red-500' : 'border-slate-600'
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none ${
          error ? 'border-red-500' : 'border-slate-600'
        } ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, options, placeholder, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer ${
          error ? 'border-red-500' : 'border-slate-600'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" className="text-slate-400">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = 'Select';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function RadioGroup({ name, options, value, onChange, error }: RadioGroupProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
            value === option.value
              ? 'border-blue-500 bg-blue-500/10'
              : error
              ? 'border-red-500 bg-slate-700/50'
              : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-4 h-4 text-blue-500 border-slate-500 focus:ring-blue-500 focus:ring-offset-slate-800"
          />
          <div>
            <span className="block font-medium text-white">{option.label}</span>
            {option.description && (
              <span className="text-sm text-slate-400">{option.description}</span>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

interface CardSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface CardSelectProps {
  options: CardSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: boolean;
  columns?: 2 | 3;
}

export function CardSelect({ options, value, onChange, error, columns = 3 }: CardSelectProps) {
  const gridCols = columns === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`p-4 rounded-xl border text-center transition-all ${
            value === option.value
              ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
              : error
              ? 'border-red-500 bg-slate-700/50'
              : 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-700'
          }`}
        >
          {option.icon && (
            <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
              value === option.value ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-600 text-slate-400'
            }`}>
              {option.icon}
            </div>
          )}
          <span className="block font-medium text-white">{option.label}</span>
          {option.description && (
            <span className="text-xs text-slate-400 mt-1">{option.description}</span>
          )}
        </button>
      ))}
    </div>
  );
}
