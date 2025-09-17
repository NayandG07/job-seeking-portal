'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const ToastContext = createContext(undefined);

const toastVariants = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconColor: 'text-green-400'
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-400'
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconColor: 'text-yellow-400'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconColor: 'text-blue-400'
  }
};

function ToastComponent({ toast, onClose }) {
  const variant = toastVariants[toast.type];
  const Icon = variant.icon;

  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  return (
    <div className={cn(
      'flex items-start p-4 rounded-lg border shadow-lg max-w-sm w-full animate-in',
      variant.className
    )}>
      <Icon className={cn('h-5 w-5 mt-0.5 mr-3 flex-shrink-0', variant.iconColor)} />
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-medium mb-1">
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p className="text-sm">
            {toast.message}
          </p>
        )}
      </div>
      
      <button
        onClick={() => onClose(toast.id)}
        className={cn(
          'ml-2 flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors',
          toast.type === 'success' && 'text-green-500',
          toast.type === 'error' && 'text-red-500',
          toast.type === 'warning' && 'text-yellow-500',
          toast.type === 'info' && 'text-blue-500'
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (message, options = {}) => addToast({ type: 'success', message, ...options }),
    error: (message, options = {}) => addToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) => addToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) => addToast({ type: 'info', message, ...options }),
    remove: removeToast,
    clear: () => setToasts([])
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}