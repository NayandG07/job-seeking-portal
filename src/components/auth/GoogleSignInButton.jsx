'use client';

import React from 'react';
import { FcGoogle } from 'react-icons/fc';

export default function GoogleSignInButton({ 
  onClick, 
  loading = false, 
  children = "Continue with Google",
  variant = "outline" 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium text-sm
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === "outline" 
          ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
          : "bg-white text-gray-700 shadow-md hover:shadow-lg border border-gray-200"
        }
      `}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : (
        <FcGoogle className="w-5 h-5" />
      )}
      <span>{loading ? "Signing in..." : children}</span>
    </button>
  );
}