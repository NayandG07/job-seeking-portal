'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../common/Toast.jsx';
import { FirebaseError } from 'firebase/app';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Modal from '../common/Modal.jsx';
import Alert from '../common/Alert.jsx';

export default function PasswordResetModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();
  const toast = useToast();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('No account found with this email address.');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address.');
            break;
          case 'auth/too-many-requests':
            setError('Too many requests. Please try again later.');
            break;
          default:
            setError('Failed to send reset email. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      toast.error('Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password">
      <div className="space-y-6">
        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Email Sent!
            </h3>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your inbox and follow the instructions to reset your password.
            </p>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Forgot Your Password?
              </h3>
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
                autoComplete="email"
              />

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading || !email.trim()}
                  className="flex-1"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}