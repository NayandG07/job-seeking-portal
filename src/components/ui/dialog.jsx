'use client';

import React from 'react';

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 max-h-[90vh] max-w-[90vw] overflow-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ className = '', children }) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto ${className}`}>
      {children}
    </div>
  );
};

const DialogHeader = ({ className = '', children }) => {
  return (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>
      {children}
    </div>
  );
};

const DialogTitle = ({ className = '', children }) => {
  return (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
};

const DialogFooter = ({ className = '', children }) => {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>
      {children}
    </div>
  );
};

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter };