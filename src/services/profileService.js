import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient.js';
import { supabase } from '../lib/supabaseClient.js';
import { generateUniqueFilename } from '../utils/fileValidation.js';

/**
 * Get student profile from Firestore
 */
export async function getStudentProfile(userId) {
  try {
    const profileRef = doc(db, 'studentProfiles', userId);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        resume: data.resume ? {
          ...data.resume,
          uploadedAt: data.resume.uploadedAt?.toDate() || new Date(),
        } : undefined,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching student profile:', error);
    throw error;
  }
}

/**
 * Create or update student profile
 */
export async function saveStudentProfile(userId, profileData) {
  try {
    const profileRef = doc(db, 'studentProfiles', userId);
    const existingProfile = await getDoc(profileRef);
    
    const dataToSave = {
      ...profileData,
      userId,
      updatedAt: serverTimestamp(),
    };
    
    if (existingProfile.exists()) {
      // Update existing profile
      await updateDoc(profileRef, dataToSave);
    } else {
      // Create new profile
      await setDoc(profileRef, {
        ...dataToSave,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error saving student profile:', error);
    throw error;
  }
}

/**
 * Upload resume file to Supabase Storage
 */
export async function uploadResume(file, userId, _onProgress) {
  try {
    const filename = generateUniqueFilename(file.name, userId);
    
    // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from('resumes')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true, // Replace if exists
      });
    
    if (error) {
      throw new Error(`Failed to upload resume: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filename);
    
    const resumeInfo = {
      url: urlData.publicUrl,
      filename: file.name,
      sizeBytes: file.size,
      uploadedAt: new Date(),
      provider: 'supabase',
    };
    
    return resumeInfo;
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
}

/**
 * Delete resume from Supabase Storage and update profile
 */
export async function deleteResume(userId, resumePath) {
  try {
    // Extract filename from URL/path
    const filename = resumePath.split('/').pop();
    if (!filename) {
      throw new Error('Invalid resume path');
    }
    
    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('resumes')
      .remove([`resumes/${userId}/${filename}`]);
    
    if (error) {
      console.warn('Warning: Failed to delete resume from storage:', error);
      // Don't throw error here as we still want to update the profile
    }
    
    // Update profile to remove resume reference
    const profileRef = doc(db, 'studentProfiles', userId);
    await updateDoc(profileRef, {
      resume: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    throw error;
  }
}

/**
 * Add education entry to profile
 */
export async function addEducation(userId, educationEntry) {
  try {
    const profile = await getStudentProfile(userId);
    if (!profile) {
      throw new Error('Student profile not found');
    }
    
    const newEducation = {
      ...educationEntry,
      id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedEducation = [...profile.education, newEducation];
    
    await saveStudentProfile(userId, { education: updatedEducation });
  } catch (error) {
    console.error('Error adding education:', error);
    throw error;
  }
}

/**
 * Update education entry in profile
 */
export async function updateEducation(userId, educationId, updates) {
  try {
    const profile = await getStudentProfile(userId);
    if (!profile) {
      throw new Error('Student profile not found');
    }
    
    const updatedEducation = profile.education.map(edu => 
      edu.id === educationId ? { ...edu, ...updates } : edu
    );
    
    await saveStudentProfile(userId, { education: updatedEducation });
  } catch (error) {
    console.error('Error updating education:', error);
    throw error;
  }
}

/**
 * Remove education entry from profile
 */
export async function removeEducation(userId, educationId) {
  try {
    const profile = await getStudentProfile(userId);
    if (!profile) {
      throw new Error('Student profile not found');
    }
    
    const updatedEducation = profile.education.filter(edu => edu.id !== educationId);
    
    await saveStudentProfile(userId, { education: updatedEducation });
  } catch (error) {
    console.error('Error removing education:', error);
    throw error;
  }
}