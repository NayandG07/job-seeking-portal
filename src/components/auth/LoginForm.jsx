'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../common/Toast.jsx';
import { FirebaseError } from 'firebase/app';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Alert from '../common/Alert.jsx';
import PasswordResetModal from './PasswordResetModal.jsx';

export default function LoginForm({ onToggleMode, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const { signIn, userProfile } = useAuth();
  const toast = useToast();

  // Validation function
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) return 'Email is required';
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';

      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';

      default:
        return '';
    }
  };

  // Real-time validation effect
  useEffect(() => {
    const newFieldErrors = {};
    if (touched.email) {
      const emailError = validateField('email', email);
      if (emailError) newFieldErrors.email = emailError;
    }
    if (touched.password) {
      const passwordError = validateField('password', password);
      if (passwordError) newFieldErrors.password = passwordError;
    }
    setFieldErrors(newFieldErrors);
  }, [email, password, touched]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleBlur = (field) => () => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
  };

  const validateForm = () => {
    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);
    
    const newFieldErrors = {};
    if (emailError) newFieldErrors.email = emailError;
    if (passwordError) newFieldErrors.password = passwordError;
    
    setFieldErrors(newFieldErrors);
    setTouched({ email: true, password: true });
    
    return !emailError && !passwordError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Welcome back! You have been signed in successfully.');
      onSuccess?.();
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('No account found with this email address.');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password.');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address.');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later.');
            break;
          case 'auth/invalid-credential':
            setError('Invalid email or password. Please check your credentials.');
            break;
          case 'auth/user-disabled':
            setError('This account has been disabled. Please contact support.');
            break;
          default:
            setError('Failed to sign in. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      toast.error('Sign in failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Sign In
      </h2>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleBlur('email')}
          placeholder="Enter your email"
          error={fieldErrors.email}
          required
          disabled={loading}
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          onBlur={handleBlur('password')}
          placeholder="Enter your password"
          error={fieldErrors.password}
          required
          disabled={loading}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => setShowResetModal(true)}
            >
              Forgot your password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={loading || Object.keys(fieldErrors).length > 0}
          className="w-full"
          size="lg"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Don&apos;t have an account? Sign up
          </button>
        </div>
      </form>

      <PasswordResetModal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
      />
    </div>
  );
}