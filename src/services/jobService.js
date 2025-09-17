import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient.js';

const JOBS_COLLECTION = 'jobs';

export async function createJob(recruiterId, jobData) {
  try {
    const job = {
      ...jobData,
      companyId: recruiterId, // Assuming recruiter creates for their company
      postedBy: recruiterId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    const docRef = await addDoc(collection(db, JOBS_COLLECTION), job);
    return docRef.id;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
}

export async function getJob(jobId) {
  try {
    const jobRef = doc(db, JOBS_COLLECTION, jobId);
    const jobSnap = await getDoc(jobRef);
    
    if (jobSnap.exists()) {
      const data = jobSnap.data();
      return {
        id: jobSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        applicationDeadline: data.applicationDeadline?.toDate()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting job:', error);
    throw error;
  }
}

export async function updateJob(jobId, updateData) {
  try {
    const jobRef = doc(db, JOBS_COLLECTION, jobId);
    const updatedData = {
      ...updateData,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(jobRef, updatedData);
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
}

export async function deleteJob(jobId) {
  try {
    const jobRef = doc(db, JOBS_COLLECTION, jobId);
    await deleteDoc(jobRef);
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}

export async function getAllJobs(filters) {
  try {
    let jobsQuery = query(
      collection(db, JOBS_COLLECTION),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    // Apply filters if provided
    if (filters) {
      if (filters.type) {
        jobsQuery = query(jobsQuery, where('type', '==', filters.type));
      }
      if (filters.location) {
        jobsQuery = query(jobsQuery, where('location', '==', filters.location));
      }
      if (filters.experienceLevel) {
        jobsQuery = query(jobsQuery, where('experienceLevel', '==', filters.experienceLevel));
      }
      if (filters.companyId) {
        jobsQuery = query(jobsQuery, where('companyId', '==', filters.companyId));
      }
      if (filters.skills && filters.skills.length > 0) {
        jobsQuery = query(jobsQuery, where('skills', 'array-contains-any', filters.skills));
      }
    }
    
    const querySnapshot = await getDocs(jobsQuery);
    const jobs = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        applicationDeadline: data.applicationDeadline?.toDate()
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('Error getting all jobs:', error);
    throw error;
  }
}

export async function getJobsByRecruiter(recruiterId) {
  try {
    const jobsQuery = query(
      collection(db, JOBS_COLLECTION),
      where('postedBy', '==', recruiterId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(jobsQuery);
    const jobs = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        applicationDeadline: data.applicationDeadline?.toDate()
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('Error getting jobs by recruiter:', error);
    throw error;
  }
}

export async function getJobsByCompany(companyId) {
  try {
    const jobsQuery = query(
      collection(db, JOBS_COLLECTION),
      where('companyId', '==', companyId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(jobsQuery);
    const jobs = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        applicationDeadline: data.applicationDeadline?.toDate()
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('Error getting jobs by company:', error);
    throw error;
  }
}

export async function getRecentJobs(limitCount = 10) {
  try {
    const jobsQuery = query(
      collection(db, JOBS_COLLECTION),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(jobsQuery);
    const jobs = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        applicationDeadline: data.applicationDeadline?.toDate()
      });
    });
    
    return jobs;
  } catch (error) {
    console.error('Error getting recent jobs:', error);
    throw error;
  }
}

export async function searchJobs(searchTerm) {
  try {
    // Note: This is a basic search implementation
    // For production, consider using a search service like Algolia or Elasticsearch
    const jobsQuery = query(
      collection(db, JOBS_COLLECTION),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(jobsQuery);
    const jobs = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const job = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        applicationDeadline: data.applicationDeadline?.toDate()
      };
      
      // Simple text search in title, company name, and description
      const searchText = searchTerm.toLowerCase();
      if (
        job.title.toLowerCase().includes(searchText) ||
        job.companyName.toLowerCase().includes(searchText) ||
        job.description?.toLowerCase().includes(searchText) ||
        job.skills?.some(skill => skill.toLowerCase().includes(searchText))
      ) {
        jobs.push(job);
      }
    });
    
    return jobs;
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
}