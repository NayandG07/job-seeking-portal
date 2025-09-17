'use client';

import React from 'react';
import { cn } from '../../lib/utils.js';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

const alertVariants = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-400'
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle,
    iconColor: 'text-red-400'
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertCircle,
    iconColor: 'text-yellow-400'
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-400'
  }
};

export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
  ...props
}) {
  const variantConfig = alertVariants[variant];
  const Icon = variantConfig.icon;

  return (
    <div
      className={cn(
        'p-4 border rounded-lg',
        variantConfig.container,
        className
      )}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={cn('h-5 w-5', variantConfig.iconColor)} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  variant === 'success' && 'text-green-500 hover:bg-green-100 focus:ring-green-600',
                  variant === 'error' && 'text-red-500 hover:bg-red-100 focus:ring-red-600',
                  variant === 'warning' && 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600',
                  variant === 'info' && 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
                )}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}