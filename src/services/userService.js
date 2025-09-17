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

const USERS_COLLECTION = 'users';

export async function createUserProfile(uid, userData) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userProfile = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      emailVerified: false
    };
    
    await setDoc(userRef, userProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(uid) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        uid,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(uid, updateData) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const updatedData = {
      ...updateData,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(userRef, updatedData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function deleteUserProfile(uid) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
}

export async function getAllUsers() {
  try {
    const usersQuery = query(
      collection(db, USERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

export async function getUsersByRole(role) {
  try {
    const usersQuery = query(
      collection(db, USERS_COLLECTION),
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
}