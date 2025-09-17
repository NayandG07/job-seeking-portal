'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchJobs } from '../../services/companyService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { hasAppliedToJob } from '../../services/applicationService.js';
import JobApplicationModal from '../../components/applications/JobApplicationModal.jsx';

function JobsPageContent() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams?.get('search') || '',
    location: searchParams?.get('location') || '',
    type: searchParams?.get('type') || undefined,
    experience: searchParams?.get('experience') || undefined,
  });

  const [showFilters, setShowFilters] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await searchJobs(filters, 12);
      setJobs(result.jobs);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load jobs
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Load application status for student users
  useEffect(() => {
    if (userProfile?.role === 'student' && jobs.length > 0) {
      checkApplicationStatus();
    }
  }, [jobs, userProfile]);

  const checkApplicationStatus = async () => {
    if (!userProfile || userProfile.role !== 'student') return;

    try {
      const appliedJobsSet = new Set();
      const promises = jobs.map(async (job) => {
        const hasApplied = await hasAppliedToJob(userProfile.uid, job.id);
        if (hasApplied) {
          appliedJobsSet.add(job.id);
        }
      });
      
      await Promise.all(promises);
      setAppliedJobs(appliedJobsSet);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleApply = (job) => {
    if (!userProfile) {
      alert('Please sign in to apply for jobs');
      router.push('/auth');
      return;
    }

    if (userProfile.role !== 'student') {
      alert('Only students can apply to jobs');
      return;
    }

    if (appliedJobs.has(job.id)) {
      alert('You have already applied to this job');
      return;
    }

    // Convert JobPosting to Job type
    const jobData = {
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl,
      location: job.location,
      type: job.type,
      experienceLevel: job.experience,
      salaryRange: job.salaryRange ? `$${job.salaryRange.min.toLocaleString()} - $${job.salaryRange.max.toLocaleString()}` : undefined,
      skills: job.skills,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      companyId: job.companyId,
      createdAt: job.postedAt,
      updatedAt: job.updatedAt,
      isActive: job.status === 'active',
      applicationDeadline: job.deadline,
      postedBy: job.companyId // Using companyId as fallback for postedBy
    };

    setSelectedJob(jobData);
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    if (selectedJob) {
      setAppliedJobs(prev => new Set([...prev, selectedJob.id]));
    }
    setShowApplicationModal(false);
    setSelectedJob(null);
  };

  const formatSalary = (salaryRange) => {
    if (!salaryRange) return 'Salary not specified';
    
    const { min, max, currency, period } = salaryRange;
    const periodText = period === 'yearly' ? '/year' : period === 'monthly' ? '/month' : '/hour';
    
    if (min === max) {
      return `${currency}${min.toLocaleString()}${periodText}`;
    }
    
    return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}${periodText}`;
  };

  const formatPostedDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Opportunities</h1>
              <p className="mt-1 text-sm text-gray-500">
                Discover your next career opportunity
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} mb-8 lg:mb-0`}>
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Jobs
                </label>
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Job title, company, skills..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="City, State"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Job Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={filters.experience || ''}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <button
                onClick={loadJobs}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Apply Filters'}
              </button>
            </div>
          </div>

          {/* Jobs List */}
          <div className="lg:col-span-3">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                {jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        {job.companyLogoUrl && (
                          <img
                            src={job.companyLogoUrl}
                            alt={`${job.companyName} logo`}
                            className="w-12 h-12 object-contain border border-gray-200 rounded"
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                            {job.title}
                          </h3>
                          <p className="text-gray-600">{job.companyName}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span>{job.location}</span>
                            <span>•</span>
                            <span className="capitalize">{job.type.replace('-', ' ')}</span>
                            <span>•</span>
                            <span className="capitalize">{job.experience} Level</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatPostedDate(job.postedAt)}</p>
                        {job.deadline && (
                          <p className="text-xs text-red-600 mt-1">
                            Deadline: {job.deadline.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {job.description.length > 200 
                        ? `${job.description.substring(0, 200)}...` 
                        : job.description}
                    </p>

                    {/* Skills */}
                    {job.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 6).map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 6 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{job.skills.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatSalary(job.salaryRange)}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => router.push(`/jobs/${job.id}`)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          View Details
                        </button>
                        {userProfile?.role === 'student' ? (
                          appliedJobs.has(job.id) ? (
                            <button
                              disabled
                              className="px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md cursor-not-allowed"
                            >
                              Applied ✓
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApply(job)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Apply Now
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleApply(job)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center py-8">
                    <button
                      onClick={loadJobs}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Load More Jobs
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6m0 0v6m0-6H8m0 0v6m0-6H8" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500">Try adjusting your search filters to find more opportunities</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {selectedJob && (
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <JobsPageContent />
    </Suspense>
  );
}