'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getStudentApplications, deleteApplication } from '../../services/applicationService.js';

const APPLICATION_STATUS_LABELS = {
  pending: 'Under Review',
  reviewed: 'Reviewed',
  accepted: 'Accepted',
  rejected: 'Rejected'
};

const APPLICATION_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

export default function ApplicationsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not authenticated or not a student
    if (userProfile && userProfile.role !== 'student') {
      router.push('/dashboard');
      return;
    }
    
    if (user) {
      loadApplications();
    }
  }, [user, userProfile, router]);

  const loadApplications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      const data = await getStudentApplications(user.uid);
      setApplications(data);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      'Are you sure you want to withdraw this application? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;

    try {
      await deleteApplication(applicationId, user.uid);
      alert('Application withdrawn successfully');
      // Remove from local state
      setApplications(prev => prev.filter(app => app.id !== applicationId));
    } catch (error) {
      console.error('Error deleting application:', error);
      alert(error instanceof Error ? error.message : 'Failed to withdraw application');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    // Handle Firestore Timestamp
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    
    // Handle regular Date
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    
    return new Date(date).toLocaleDateString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'reviewed':
        return (
          <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14l-4-4" />
          </svg>
        );
      case 'accepted':
        return <span className="text-green-600 text-lg">✓</span>;
      case 'rejected':
        return <span className="text-red-600 text-lg">✗</span>;
      default:
        return (
          <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading your applications...</span>
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
              <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track your job application status and manage your submissions
              </p>
            </div>
            <button
              onClick={() => router.push('/jobs')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </button>
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

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500 mb-4">
              Start applying to jobs to track your applications here
            </p>
            <button
              onClick={() => router.push('/jobs')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Find Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {applications.length} application{applications.length !== 1 ? 's' : ''} found
            </div>

            {applications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {application.companyLogoUrl && (
                          <img
                            src={application.companyLogoUrl}
                            alt={`${application.companyName} logo`}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {application.jobTitle}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-600 mb-3">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-sm">{application.companyName}</span>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${APPLICATION_STATUS_COLORS[application.status]}`}>
                              {getStatusIcon(application.status)}
                              {APPLICATION_STATUS_LABELS[application.status]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      {application.status === 'pending' && (
                        <button
                          onClick={() => handleDeleteApplication(application.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Withdraw Application"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Application Timeline */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Applied: {formatDate(application.appliedAt)}</span>
                      </div>
                      {application.reviewedAt && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Reviewed: {formatDate(application.reviewedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Application Tips */}
        {applications.length > 0 && (
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Application Tips</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Follow up with recruiters 1-2 weeks after applying if you haven't heard back</li>
              <li>• Keep your resume updated and ensure it matches the job requirements</li>
              <li>• You can only withdraw applications that are still pending review</li>
              <li>• Consider applying to similar roles to increase your chances</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}