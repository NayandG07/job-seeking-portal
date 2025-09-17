'use client';

import React from 'react';

/**
 * PasswordStrength Component
 * 
 * Shows password strength indicator with visual feedback
 */
export default function PasswordStrength({ password, className = '' }) {
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    // Calculate score
    if (checks.length) score += 1;
    if (checks.lowercase) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.numbers) score += 1;
    if (checks.special) score += 1;

    // Determine strength
    if (score <= 1) return { score: 1, label: 'Very Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Weak', color: 'bg-orange-500' };
    if (score === 3) return { score: 3, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 4) return { score: 4, label: 'Strong', color: 'bg-blue-500' };
    if (score === 5) return { score: 5, label: 'Very Strong', color: 'bg-green-500' };

    return { score: 0, label: '', color: '' };
  };

  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full transition-colors duration-200 ${
              level <= strength.score ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Strength Label */}
      <div className="flex justify-between items-center text-xs">
        <span className={`font-medium ${
          strength.score <= 2 ? 'text-red-600' :
          strength.score === 3 ? 'text-yellow-600' :
          strength.score === 4 ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {strength.label}
        </span>
        <span className="text-gray-500">
          {strength.score}/5
        </span>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1 text-xs">
        <RequirementItem 
          met={password.length >= 8} 
          text="At least 8 characters" 
        />
        <RequirementItem 
          met={/[a-z]/.test(password)} 
          text="One lowercase letter" 
        />
        <RequirementItem 
          met={/[A-Z]/.test(password)} 
          text="One uppercase letter" 
        />
        <RequirementItem 
          met={/\d/.test(password)} 
          text="One number" 
        />
        <RequirementItem 
          met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)} 
          text="One special character" 
        />
      </div>
    </div>
  );
}

function RequirementItem({ met, text }) {
  return (
    <div className={`flex items-center space-x-2 ${met ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
        met ? 'bg-green-500 border-green-500' : 'border-gray-300'
      }`}>
        {met && (
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span>{text}</span>
    </div>
  );
}