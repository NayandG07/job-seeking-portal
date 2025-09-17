'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext.jsx';
import Layout from '../components/common/Layout.jsx';
import { FullPageLoader } from '../components/common/LoadingSpinner.jsx';
import Button from '../components/common/Button.jsx';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <FullPageLoader message="Loading application..." />;
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Find Your Dream
              <span className="text-indigo-600"> Job</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
              Connect students with opportunities and help recruiters find the
              best talent. Your career journey starts here.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth?role=student">
                <Button size="lg" className="w-full sm:w-auto">
                  Join as Student
                </Button>
              </Link>
              <Link href="/auth?role=recruiter">
                <Button variant="success" size="lg" className="w-full sm:w-auto">
                  Post Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* For Students */}
            <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-6">🎓</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                For Students
              </h3>
              <ul className="text-gray-600 space-y-3 text-left">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Create professional profiles
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Upload and manage resumes
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Browse and apply to jobs
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Track application status
                </li>
              </ul>
            </div>

            {/* For Recruiters */}
            <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-6">💼</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                For Recruiters
              </h3>
              <ul className="text-gray-600 space-y-3 text-left">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Post and manage job openings
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Review candidate applications
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Download resumes securely
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Manage company profiles
                </li>
              </ul>
            </div>

            {/* Secure & Fast */}
            <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-6">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Secure & Fast
              </h3>
              <ul className="text-gray-600 space-y-3 text-left">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Secure file storage
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Role-based access control
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Real-time updates
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Mobile responsive design
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Development Notice */}
        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Job Seeking Portal</h3>
              <p className="text-gray-300">
                Built with Next.js, Firebase, Supabase, and Cloudinary
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
}