import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient.js';

const STUDENT_PROFILES_COLLECTION = 'studentProfiles';

export async function createStudentProfile(uid, profileData) {
  try {
    const studentRef = doc(db, STUDENT_PROFILES_COLLECTION, uid);
    const studentProfile = {
      ...profileData,
      email: '', // This will be filled from user data
      displayName: `${profileData.firstName} ${profileData.lastName}`,
      role: 'student',
      skills: profileData.skills || [],
      education: [],
      experience: [],
      projects: [],
      preferredJobTypes: profileData.preferredJobTypes || [],
      preferredLocations: profileData.preferredLocations || [],
      profileCompleteness: 20, // Base completion percentage
      isProfilePublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      emailVerified: false
    };
    
    await setDoc(studentRef, studentProfile);
  } catch (error) {
    console.error('Error creating student profile:', error);
    throw error;
  }
}

export async function getStudentProfile(uid) {
  try {
    const studentRef = doc(db, STUDENT_PROFILES_COLLECTION, uid);
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists()) {
      const data = studentSnap.data();
      return {
        uid,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dateOfBirth: data.dateOfBirth?.toDate(),
        education: data.education?.map((edu) => ({
          ...edu,
          startDate: edu.startDate?.toDate(),
          endDate: edu.endDate?.toDate()
        })) || [],
        experience: data.experience?.map((exp) => ({
          ...exp,
          startDate: exp.startDate?.toDate(),
          endDate: exp.endDate?.toDate()
        })) || [],
        projects: data.projects?.map((proj) => ({
          ...proj,
          startDate: proj.startDate?.toDate(),
          endDate: proj.endDate?.toDate()
        })) || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting student profile:', error);
    throw error;
  }
}

export async function updateStudentProfile(uid, updateData) {
  try {
    const studentRef = doc(db, STUDENT_PROFILES_COLLECTION, uid);
    
    // Calculate profile completeness
    const profileCompleteness = calculateProfileCompleteness(updateData);
    
    const updatedData = {
      ...updateData,
      profileCompleteness,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(studentRef, updatedData);
  } catch (error) {
    console.error('Error updating student profile:', error);
    throw error;
  }
}

export async function deleteStudentProfile(uid) {
  try {
    const studentRef = doc(db, STUDENT_PROFILES_COLLECTION, uid);
    await deleteDoc(studentRef);
  } catch (error) {
    console.error('Error deleting student profile:', error);
    throw error;
  }
}

export async function getAllStudentProfiles() {
  try {
    const studentsQuery = query(
      collection(db, STUDENT_PROFILES_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(studentsQuery);
    const students = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      students.push({
        uid: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dateOfBirth: data.dateOfBirth?.toDate(),
        education: data.education?.map((edu) => ({
          ...edu,
          startDate: edu.startDate?.toDate(),
          endDate: edu.endDate?.toDate()
        })) || [],
        experience: data.experience?.map((exp) => ({
          ...exp,
          startDate: exp.startDate?.toDate(),
          endDate: exp.endDate?.toDate()
        })) || [],
        projects: data.projects?.map((proj) => ({
          ...proj,
          startDate: proj.startDate?.toDate(),
          endDate: proj.endDate?.toDate()
        })) || []
      });
    });
    
    return students;
  } catch (error) {
    console.error('Error getting all student profiles:', error);
    throw error;
  }
}

export async function getStudentsBySkills(skills) {
  try {
    const studentsQuery = query(
      collection(db, STUDENT_PROFILES_COLLECTION),
      where('skills', 'array-contains-any', skills),
      where('isProfilePublic', '==', true)
    );
    
    const querySnapshot = await getDocs(studentsQuery);
    const students = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      students.push({
        uid: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dateOfBirth: data.dateOfBirth?.toDate(),
        education: data.education?.map((edu) => ({
          ...edu,
          startDate: edu.startDate?.toDate(),
          endDate: edu.endDate?.toDate()
        })) || [],
        experience: data.experience?.map((exp) => ({
          ...exp,
          startDate: exp.startDate?.toDate(),
          endDate: exp.endDate?.toDate()
        })) || [],
        projects: data.projects?.map((proj) => ({
          ...proj,
          startDate: proj.startDate?.toDate(),
          endDate: proj.endDate?.toDate()
        })) || []
      });
    });
    
    return students;
  } catch (error) {
    console.error('Error getting students by skills:', error);
    throw error;
  }
}

function calculateProfileCompleteness(profile) {
  let completeness = 0;
  const weights = {
    basicInfo: 20, // firstName, lastName, email
    academicInfo: 15, // university, major, graduationYear
    skills: 15,
    education: 10,
    experience: 15,
    projects: 10,
    resume: 10,
    preferences: 5
  };

  // Basic info (already exists if profile is created)
  completeness += weights.basicInfo;

  // Academic info
  if (profile.university && profile.major && profile.graduationYear) {
    completeness += weights.academicInfo;
  }

  // Skills
  if (profile.skills && profile.skills.length > 0) {
    completeness += weights.skills;
  }

  // Education
  if (profile.education && profile.education.length > 0) {
    completeness += weights.education;
  }

  // Experience
  if (profile.experience && profile.experience.length > 0) {
    completeness += weights.experience;
  }

  // Projects
  if (profile.projects && profile.projects.length > 0) {
    completeness += weights.projects;
  }

  // Resume
  if (profile.resumeUrl) {
    completeness += weights.resume;
  }

  // Preferences
  if (profile.preferredJobTypes && profile.preferredJobTypes.length > 0) {
    completeness += weights.preferences;
  }

  return Math.min(completeness, 100);
}