'use client';

import React from 'react';
import { cn } from '../../lib/utils.js';

export default function Input({
  label,
  error,
  helperText,
  className = '',
  type = 'text',
  required = false,
  disabled = false,
  ...props
}) {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          error 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-300 bg-white hover:border-gray-400',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  helperText,
  children,
  className = '',
  required = false,
  disabled = false,
  ...props
}) {
  const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={selectId}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          error 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-300 bg-white hover:border-gray-400',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          className
        )}
        {...props}
      >
        {children}
      </select>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  helperText,
  className = '',
  required = false,
  disabled = false,
  rows = 4,
  ...props
}) {
  const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm transition-colors resize-vertical',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          error 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-300 bg-white hover:border-gray-400',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}