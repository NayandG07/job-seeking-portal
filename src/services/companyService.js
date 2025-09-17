import {
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient.js';

/**
 * Upload logo to Cloudinary (client-side with unsigned upload)
 */
export async function uploadLogo(file, companyId) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'job-portal-logos'); // You'll need to create this preset in Cloudinary
    formData.append('folder', `job-portal/logos/${companyId}`);
    formData.append('transformation', 'c_fit,w_400,h_400,q_auto,f_auto');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

/**
 * Delete logo from Cloudinary
 */
export async function deleteLogo(publicId) {
  try {
    // For client-side deletion, we'd need to make a call to our API route
    // For now, logos will accumulate in Cloudinary during development
    // TODO: Implement server-side deletion via API route
  } catch (error) {
    console.error('Error deleting logo:', error);
    // Don't throw error as this shouldn't block company operations
  }
}

/**
 * Get companies owned by a specific user
 */
export async function getUserCompanies(ownerId) {
  try {
    const companiesRef = collection(db, 'companies');
    const q = query(companiesRef, where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error('Error fetching user companies:', error);
    throw error;
  }
}

/**
 * Get a specific company by ID
 */
export async function getCompany(companyId) {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);

    if (companySnap.exists()) {
      const data = companySnap.data();
      return {
        id: companySnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}

/**
 * Create a new company
 */
export async function createCompany(ownerId, companyData, logoResult) {
  try {
    const newCompany = {
      ownerId,
      ...companyData,
      logoUrl: logoResult?.url,
      logoPublicId: logoResult?.publicId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const companiesRef = collection(db, 'companies');
    const docRef = await addDoc(companiesRef, newCompany);

    return {
      id: docRef.id,
      ...companyData,
      ownerId,
      logoUrl: logoResult?.url,
      logoPublicId: logoResult?.publicId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

/**
 * Update an existing company
 */
export async function updateCompany(companyId, companyData, logoResult) {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const updateData = {
      ...companyData,
      updatedAt: serverTimestamp(),
    };

    if (logoResult) {
      updateData.logoUrl = logoResult.url;
      updateData.logoPublicId = logoResult.publicId;
    }

    await updateDoc(companyRef, updateData);
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
}

/**
 * Delete a company and all its jobs
 */
export async function deleteCompany(companyId) {
  try {
    // First, delete all jobs for this company
    const jobsRef = collection(db, 'jobs');
    const jobsQuery = query(jobsRef, where('companyId', '==', companyId));
    const jobsSnapshot = await getDocs(jobsQuery);

    const deletionPromises = jobsSnapshot.docs.map(jobDoc => deleteDoc(jobDoc.ref));
    await Promise.all(deletionPromises);

    // Then delete the company
    const companyRef = doc(db, 'companies', companyId);
    await deleteDoc(companyRef);
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
}

/**
 * Get jobs for a specific company
 */
export async function getCompanyJobs(companyId) {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('companyId', '==', companyId),
      orderBy('postedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      postedAt: doc.data().postedAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      deadline: doc.data().deadline?.toDate(),
    }));
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    throw error;
  }
}

/**
 * Create a new job posting
 */
export async function createJob(companyId, jobData) {
  try {
    // Get company info for denormalization
    const company = await getCompany(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const newJob = {
      companyId,
      companyName: company.name,
      companyLogoUrl: company.logoUrl,
      ...jobData,
      deadline: jobData.deadline ? new Date(jobData.deadline) : null,
      postedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'draft',
      applicationCount: 0,
    };

    const jobsRef = collection(db, 'jobs');
    const docRef = await addDoc(jobsRef, newJob);

    return {
      id: docRef.id,
      companyId,
      companyName: company.name,
      companyLogoUrl: company.logoUrl,
      ...jobData,
      deadline: jobData.deadline ? new Date(jobData.deadline) : undefined,
      postedAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
      applicationCount: 0,
    };
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
}

/**
 * Update an existing job posting
 */
export async function updateJob(jobId, jobData) {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const updateData = {
      ...jobData,
      deadline: jobData.deadline ? new Date(jobData.deadline) : null,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(jobRef, updateData);
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(jobId, status) {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
}

/**
 * Delete a job posting
 */
export async function deleteJob(jobId) {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await deleteDoc(jobRef);
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}

/**
 * Get a specific job by ID
 */
export async function getJob(jobId) {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);

    if (jobSnap.exists()) {
      const data = jobSnap.data();
      return {
        id: jobSnap.id,
        ...data,
        postedAt: data.postedAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        deadline: data.deadline?.toDate(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching job:', error);
    throw error;
  }
}

/**
 * Search jobs with filters and pagination
 */
export async function searchJobs(filters = {}, pageSize = 10, lastDoc) {
  try {
    const jobsRef = collection(db, 'jobs');
    let q = query(
      jobsRef,
      where('status', '==', 'active'),
      orderBy('postedAt', 'desc'),
      limit(pageSize + 1) // Get one extra to check if there are more
    );

    // Apply filters
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters.experience) {
      q = query(q, where('experience', '==', filters.experience));
    }
    if (filters.location) {
      q = query(q, where('location', '==', filters.location));
    }

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    // Check if there are more results
    const hasMore = docs.length > pageSize;
    const jobDocs = hasMore ? docs.slice(0, pageSize) : docs;

    let jobs = jobDocs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      postedAt: doc.data().postedAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      deadline: doc.data().deadline?.toDate(),
    }));

    // Apply client-side filters for more complex filtering
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm) ||
        job.description.toLowerCase().includes(searchTerm) ||
        job.companyName.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.skills && filters.skills.length > 0) {
      jobs = jobs.filter(job =>
        filters.skills.some(skill =>
          job.skills.some(jobSkill =>
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    if (filters.salaryMin) {
      jobs = jobs.filter(job =>
        job.salaryRange && job.salaryRange.min >= filters.salaryMin
      );
    }

    return {
      jobs,
      totalCount: jobs.length,
      hasMore: hasMore && jobs.length === pageSize,
      lastDoc: jobDocs.length > 0 ? jobDocs[jobDocs.length - 1] : undefined,
    };
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
}