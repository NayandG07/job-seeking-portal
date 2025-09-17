'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Layout from '../../components/common/Layout.jsx';
import { FullPageLoader } from '../../components/common/LoadingSpinner.jsx';
import LoginForm from '../../components/auth/LoginForm.jsx';
import SignUpForm from '../../components/auth/SignUpForm.jsx';
import AuthErrorBoundary from '../../components/auth/AuthErrorBoundary.jsx';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the intended role from URL params
  const intendedRole = searchParams.get('role');

  // Redirect if already authenticated based on user role
  useEffect(() => {
    if (!loading && user && userProfile) {
      // Redirect based on user's actual role, not intended role
      if (userProfile.role === 'student') {
        router.replace('/dashboard');
      } else if (userProfile.role === 'recruiter') {
        router.replace('/dashboard'); // You can change this to /recruiter/dashboard if you have a separate recruiter dashboard
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, loading, router]);

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleSuccess = () => {
    // The redirect will be handled by the useEffect when userProfile is loaded
    // No need to manually redirect here since useEffect will handle it based on the actual user role
  };

  // Show loading state while checking auth
  if (loading) {
    return <FullPageLoader message="Checking authentication..." />;
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  // Get role-specific messaging
  const getRoleMessage = () => {
    if (intendedRole === 'student') {
      return {
        title: mode === 'login' ? 'Student Login' : 'Join as Student',
        subtitle: mode === 'login' 
          ? 'Welcome back! Sign in to continue your job search.'
          : 'Create your student account to start applying for jobs.'
      };
    } else if (intendedRole === 'recruiter') {
      return {
        title: mode === 'login' ? 'Recruiter Login' : 'Join as Recruiter',
        subtitle: mode === 'login'
          ? 'Welcome back! Sign in to manage your job postings.'
          : 'Create your recruiter account to start posting jobs.'
      };
    } else {
      return {
        title: mode === 'login' ? 'Welcome Back' : 'Create Account',
        subtitle: mode === 'login'
          ? 'Please sign in to your account to continue.'
          : 'Join our platform to get started with your career journey.'
      };
    }
  };

  const roleMessage = getRoleMessage();

  return (
    <AuthErrorBoundary>
      <Layout>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {roleMessage.title}
              </h1>
              <p className="mt-2 text-gray-600">
                {roleMessage.subtitle}
              </p>
            </div>

            <div className="bg-white shadow-xl rounded-lg p-8">
              {mode === 'login' ? (
                <LoginForm
                  onToggleMode={handleToggleMode}
                  onSuccess={handleSuccess}
                />
              ) : (
                <SignUpForm
                  onToggleMode={handleToggleMode}
                  onSuccess={handleSuccess}
                  defaultRole={intendedRole || 'student'}
                />
              )}
            </div>
          </div>
        </div>
      </Layout>
    </AuthErrorBoundary>
  );
}