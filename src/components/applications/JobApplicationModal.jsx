'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';
import { Label } from '../ui/label.jsx';
import { Textarea } from '../ui/textarea.jsx';
import { createApplication } from '../../services/applicationService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function JobApplicationModal({ 
  isOpen, 
  onClose, 
  job, 
  onSuccess 
}) {
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in to apply for jobs');
      return;
    }

    if (!coverLetter.trim()) {
      alert('Please write a cover letter');
      return;
    }

    if (coverLetter.trim().length < 50) {
      alert('Cover letter must be at least 50 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      await createApplication(user.uid, {
        jobId: job.id,
        coverLetter: coverLetter.trim()
      });

      alert('Application submitted successfully!');
      onSuccess();
      onClose();
      setCoverLetter('');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setCoverLetter('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Apply for {job.title}
          </DialogTitle>
        </DialogHeader>

        {/* Job Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            {job.companyLogoUrl && (
              <img
                src={job.companyLogoUrl}
                alt={`${job.companyName} logo`}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm">{job.companyName}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="capitalize">{job.type.replace('-', ' ')}</span>
            </div>
            {job.experienceLevel && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>Experience: {job.experienceLevel}</span>
              </div>
            )}
            {job.salaryRange && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>{job.salaryRange}</span>
              </div>
            )}
          </div>

          {job.skills && job.skills.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
              <div className="flex flex-wrap gap-1">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverLetter" className="text-sm font-medium">
              Cover Letter *
            </Label>
            <Textarea
              id="coverLetter"
              placeholder="Write a compelling cover letter explaining why you're the perfect fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={8}
              className="resize-none"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500">
              Minimum 50 characters ({coverLetter.length}/50)
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your resume will be automatically attached to this application. 
              Make sure your profile is complete and your resume is up to date.
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || coverLetter.trim().length < 50}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}