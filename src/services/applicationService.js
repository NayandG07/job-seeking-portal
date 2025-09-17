import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient.js';
import { getUserProfile } from './userService.js';
import { getStudentProfile } from './studentService.js';
import { getJob } from './jobService.js';

const APPLICATIONS_COLLECTION = 'applications';

export async function createApplication(studentId, applicationData) {
  try {
    // Check if student already applied to this job
    const existingApplicationQuery = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('jobId', '==', applicationData.jobId),
      where('studentId', '==', studentId)
    );
    
    const existingApplications = await getDocs(existingApplicationQuery);
    
    if (!existingApplications.empty) {
      throw new Error('You have already applied to this job');
    }

    // Get student profile to check if resume exists
    const studentProfile = await getStudentProfile(studentId);
    if (!studentProfile?.resumeUrl) {
      throw new Error('Please upload a resume before applying to jobs');
    }

    // Get student user data
    const userProfile = await getUserProfile(studentId);
    if (!userProfile) {
      throw new Error('Student profile not found');
    }

    // Get job details
    const job = await getJob(applicationData.jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (!job.isActive) {
      throw new Error('This job is no longer accepting applications');
    }

    // Create application document
    const applicationDoc = {
      jobId: applicationData.jobId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl,
      studentId: studentId,
      studentName: userProfile.displayName,
      studentEmail: userProfile.email,
      resumeRef: {
        url: studentProfile.resumeUrl,
        filename: studentProfile.resumeFileName || 'resume.pdf',
        provider: 'supabase'
      },
      coverLetter: applicationData.coverLetter,
      status: 'pending',
      appliedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, APPLICATIONS_COLLECTION), applicationDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error instanceof Error ? error : new Error('Failed to submit application');
  }
}

export async function getStudentApplications(studentId) {
  try {
    const applicationsQuery = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('studentId', '==', studentId),
      orderBy('appliedAt', 'desc')
    );

    const snapshot = await getDocs(applicationsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        companyLogoUrl: data.companyLogoUrl,
        status: data.status,
        appliedAt: data.appliedAt,
        reviewedAt: data.reviewedAt
      };
    });
  } catch (error) {
    console.error('Error getting student applications:', error);
    throw new Error('Failed to load applications');
  }
}

export async function getJobApplications(jobId) {
  try {
    const applicationsQuery = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('jobId', '==', jobId),
      orderBy('appliedAt', 'desc')
    );

    const snapshot = await getDocs(applicationsQuery);
    
    const applications = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Get student profile for additional info
        let studentProfile = undefined;
        try {
          studentProfile = await getStudentProfile(data.studentId);
        } catch (error) {
          console.warn(`Could not load profile for student ${data.studentId}:`, error);
        }

        return {
          id: doc.id,
          jobId: data.jobId,
          jobTitle: data.jobTitle,
          companyName: data.companyName,
          companyLogoUrl: data.companyLogoUrl,
          studentId: data.studentId,
          studentName: data.studentName,
          studentEmail: data.studentEmail,
          resumeRef: data.resumeRef,
          coverLetter: data.coverLetter,
          status: data.status,
          appliedAt: data.appliedAt,
          reviewedAt: data.reviewedAt,
          reviewedBy: data.reviewedBy,
          notes: data.notes,
          studentProfile
        };
      })
    );

    return applications;
  } catch (error) {
    console.error('Error getting job applications:', error);
    throw new Error('Failed to load job applications');
  }
}

export async function getRecruiterApplications(recruiterId) {
  try {
    // First get all jobs by this recruiter
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('recruiterId', '==', recruiterId)
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobIds = jobsSnapshot.docs.map(doc => doc.id);
    
    if (jobIds.length === 0) {
      return [];
    }

    // Get all applications for these jobs
    // Note: Firestore 'in' queries are limited to 10 items, so we might need to batch
    const batchSize = 10;
    const applicationBatches = [];
    
    for (let i = 0; i < jobIds.length; i += batchSize) {
      const batchJobIds = jobIds.slice(i, i + batchSize);
      
      const applicationsQuery = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('jobId', 'in', batchJobIds),
        orderBy('appliedAt', 'desc')
      );

      const snapshot = await getDocs(applicationsQuery);
      
      const batchApplications = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Get student profile for additional info
          let studentProfile = undefined;
          try {
            studentProfile = await getStudentProfile(data.studentId);
          } catch (error) {
            console.warn(`Could not load profile for student ${data.studentId}:`, error);
          }

          return {
            id: doc.id,
            jobId: data.jobId,
            jobTitle: data.jobTitle,
            companyName: data.companyName,
            companyLogoUrl: data.companyLogoUrl,
            studentId: data.studentId,
            studentName: data.studentName,
            studentEmail: data.studentEmail,
            resumeRef: data.resumeRef,
            coverLetter: data.coverLetter,
            status: data.status,
            appliedAt: data.appliedAt,
            reviewedAt: data.reviewedAt,
            reviewedBy: data.reviewedBy,
            notes: data.notes,
            studentProfile
          };
        })
      );
      
      applicationBatches.push(batchApplications);
    }

    // Flatten and sort all applications
    const allApplications = applicationBatches.flat();
    return allApplications.sort((a, b) => b.appliedAt.toMillis() - a.appliedAt.toMillis());
  } catch (error) {
    console.error('Error getting recruiter applications:', error);
    throw new Error('Failed to load recruiter applications');
  }
}

export async function updateApplicationStatus(applicationId, recruiterId, updateData) {
  try {
    const applicationRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    const applicationDoc = await getDoc(applicationRef);
    
    if (!applicationDoc.exists()) {
      throw new Error('Application not found');
    }

    const applicationData = applicationDoc.data();
    
    // Verify recruiter owns the job this application is for
    const jobRef = doc(db, 'jobs', applicationData.jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists() || jobDoc.data()?.recruiterId !== recruiterId) {
      throw new Error('You are not authorized to update this application');
    }

    const updates = {
      status: updateData.status,
      reviewedAt: Timestamp.now(),
      reviewedBy: recruiterId
    };

    if (updateData.notes !== undefined) {
      updates.notes = updateData.notes;
    }

    await updateDoc(applicationRef, updates);
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error instanceof Error ? error : new Error('Failed to update application status');
  }
}

export async function getApplication(applicationId) {
  try {
    const docRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data
    };
  } catch (error) {
    console.error('Error getting application:', error);
    throw new Error('Failed to load application');
  }
}

export async function deleteApplication(applicationId, studentId) {
  try {
    const applicationRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
    const applicationDoc = await getDoc(applicationRef);
    
    if (!applicationDoc.exists()) {
      throw new Error('Application not found');
    }

    const applicationData = applicationDoc.data();
    
    if (applicationData.studentId !== studentId) {
      throw new Error('You are not authorized to delete this application');
    }

    // Only allow deletion if status is pending
    if (applicationData.status !== 'pending') {
      throw new Error('Cannot delete application that has been reviewed');
    }

    await deleteDoc(applicationRef);
  } catch (error) {
    console.error('Error deleting application:', error);
    throw error instanceof Error ? error : new Error('Failed to delete application');
  }
}

// Check if student has applied to a specific job
export async function hasAppliedToJob(studentId, jobId) {
  try {
    const applicationsQuery = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('jobId', '==', jobId),
      where('studentId', '==', studentId),
      firestoreLimit(1)
    );

    const snapshot = await getDocs(applicationsQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking application status:', error);
    return false; // Fail safe - assume not applied
  }
}

// Get application statistics for a recruiter
export async function getApplicationStats(recruiterId) {
  try {
    const applications = await getRecruiterApplications(recruiterId);
    
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      reviewed: applications.filter(app => app.status === 'reviewed').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      accepted: applications.filter(app => app.status === 'accepted').length
    };

    return stats;
  } catch (error) {
    console.error('Error getting application stats:', error);
    throw new Error('Failed to load application statistics');
  }
}