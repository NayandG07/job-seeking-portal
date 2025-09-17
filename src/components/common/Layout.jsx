'use client';

import React from 'react';
import Header from './Header.jsx';

export default function Layout({ children, className = '' }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
    </div>
  );
}