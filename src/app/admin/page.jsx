'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { 
  getAdminDashboardStats, 
  getPlatformAnalytics,
  getAllUsers,
  searchContent
} from '../../services/adminService.js';

const USER_ROLE_LABELS = {
  student: 'Student',
  recruiter: 'Recruiter',
  admin: 'Admin'
};

const USER_ROLE_COLORS = {
  student: 'bg-blue-100 text-blue-800 border-blue-200',
  recruiter: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-red-100 text-red-800 border-red-200'
};

export default function AdminDashboardPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  const [dashboardStats, setDashboardStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Redirect if not authenticated or not an admin
    if (userProfile && userProfile.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }
    
    if (user && userProfile?.role === 'admin') {
      loadDashboardData();
    }
  }, [user, userProfile, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [stats, analyticsData] = await Promise.all([
        getAdminDashboardStats(),
        getPlatformAnalytics()
      ]);
      
      setDashboardStats(stats);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Platform management and analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin Access
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'users', label: 'Users', icon: '👥' },
                { key: 'analytics', label: 'Analytics', icon: '📈' },
                { key: 'content', label: 'Content', icon: '📄' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardStats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardStats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6m0 0v6m0-6H8m0 0v6m0-6H8" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Jobs</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardStats.activeJobs}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Applications</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardStats.totalApplications}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Companies</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardStats.totalCompanies}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-blue-600">👤</span>
                  <span className="text-sm text-gray-600">New user registrations in the last 24 hours</span>
                  <span className="ml-auto text-sm font-medium text-blue-600">
                    {dashboardStats.newUsersToday || 0}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-green-600">💼</span>
                  <span className="text-sm text-gray-600">Jobs posted this week</span>
                  <span className="ml-auto text-sm font-medium text-green-600">
                    {dashboardStats.newJobsThisWeek || 0}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-purple-600">📄</span>
                  <span className="text-sm text-gray-600">Applications submitted today</span>
                  <span className="ml-auto text-sm font-medium text-purple-600">
                    {dashboardStats.applicationsToday || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <button
                onClick={() => router.push('/admin/users')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Users
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              View and manage all platform users, their roles, and account status.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Students</h4>
                <p className="text-2xl font-bold text-blue-600">{dashboardStats?.usersByRole?.student || 0}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900">Recruiters</h4>
                <p className="text-2xl font-bold text-purple-600">{dashboardStats?.usersByRole?.recruiter || 0}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900">Admins</h4>
                <p className="text-2xl font-bold text-red-600">{dashboardStats?.usersByRole?.admin || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">User Growth</h4>
                  <p className="text-sm text-gray-600">Monthly active users: {analytics.monthlyActiveUsers}</p>
                  <p className="text-sm text-gray-600">Growth rate: {analytics.userGrowthRate}%</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Job Market</h4>
                  <p className="text-sm text-gray-600">Average applications per job: {analytics.avgApplicationsPerJob}</p>
                  <p className="text-sm text-gray-600">Job success rate: {analytics.jobSuccessRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Management</h3>
            <p className="text-gray-600 mb-4">
              Monitor and moderate platform content including job postings, applications, and user profiles.
            </p>
            <div className="space-y-4">
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h4 className="font-medium text-gray-900">Job Postings</h4>
                <p className="text-sm text-gray-600">Review and approve job postings</p>
              </button>
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h4 className="font-medium text-gray-900">User Reports</h4>
                <p className="text-sm text-gray-600">Handle user reports and disputes</p>
              </button>
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h4 className="font-medium text-gray-900">Content Moderation</h4>
                <p className="text-sm text-gray-600">Moderate user-generated content</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}