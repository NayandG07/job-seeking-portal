'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../common/Toast.jsx';
import { FirebaseError } from 'firebase/app';
import Button from '../common/Button.jsx';
import Input, { Select } from '../common/Input.jsx';
import Alert from '../common/Alert.jsx';
import PasswordStrength from './PasswordStrength.jsx';

export default function SignUpForm({ onToggleMode, onSuccess, defaultRole = 'student' }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: defaultRole,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { signUp } = useAuth();
  const toast = useToast();

  // Update role when defaultRole changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      role: defaultRole
    }));
  }, [defaultRole]);

  // Real-time validation function
  const validateField = (name, value, allData = formData) => {
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) return 'Email is required';
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';

      case 'displayName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters long';
        if (value.trim().length > 50) return 'Name must be less than 50 characters';
        return '';

      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters long';
        if (value.length > 100) return 'Password must be less than 100 characters';
        
        // Check for required character types
        const requirements = [];
        if (!/(?=.*[a-z])/.test(value)) requirements.push('lowercase letter');
        if (!/(?=.*[A-Z])/.test(value)) requirements.push('uppercase letter');
        if (!/(?=.*\d)/.test(value)) requirements.push('number');
        
        if (requirements.length > 0) {
          return `Password must contain at least one ${requirements.join(', ')}`;
        }
        
        return '';

      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== allData.password) return 'Passwords do not match';
        return '';

      case 'role':
        if (!value) return 'Please select your role';
        if (!['student', 'recruiter'].includes(value)) return 'Please select a valid role';
        return '';

      default:
        return '';
    }
  };

  // Real-time validation effect
  useEffect(() => {
    const newFieldErrors = {};
    Object.keys(formData).forEach(field => {
      if (touched[field]) {
        const error = validateField(field, formData[field], formData);
        if (error) {
          newFieldErrors[field] = error;
        }
      }
    });
    setFieldErrors(newFieldErrors);
  }, [formData, touched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear global error when user starts typing
    if (error) setError('');
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
  };

  const validateForm = () => {
    const newFieldErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field], formData);
      if (error) {
        newFieldErrors[field] = error;
        isValid = false;
      }
    });

    setFieldErrors(newFieldErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.displayName, formData.role);
      toast.success(`Welcome to Job Seeking Portal! Your ${formData.role} account has been created successfully. Please check your email to verify your account.`);
      onSuccess?.();
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            setError('An account with this email already exists.');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address.');
            break;
          case 'auth/weak-password':
            setError('Password is too weak. Please choose a stronger password.');
            break;
          default:
            setError('Failed to create account. Please try again.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
      toast.error('Account creation failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Create Account
      </h2>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Full Name"
          name="displayName"
          type="text"
          value={formData.displayName}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your full name"
          error={fieldErrors.displayName}
          required
          disabled={loading}
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your email"
          error={fieldErrors.email}
          required
          disabled={loading}
        />

        <Select
          label="I am a"
          name="role"
          value={formData.role}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors.role}
          required
          disabled={loading}
        >
          <option value="student">Job Seeker / Student</option>
          <option value="recruiter">Recruiter / Employer</option>
        </Select>

        <div className="space-y-2">
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter your password"
            error={fieldErrors.password}
            required
            disabled={loading}
          />
          {formData.password && (
            <PasswordStrength password={formData.password} className="mt-2" />
          )}
        </div>

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Confirm your password"
          error={fieldErrors.confirmPassword}
          required
          disabled={loading}
        />

        <Button
          type="submit"
          loading={loading}
          disabled={loading || Object.keys(fieldErrors).length > 0}
          variant="success"
          className="w-full"
          size="lg"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Already have an account? Sign in
          </button>
        </div>
      </form>
    </div>
  );
}