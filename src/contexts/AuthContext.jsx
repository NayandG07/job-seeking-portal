'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebaseClient.js';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (user) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        
        const profile = {
          uid: user.uid,
          email: user.email || '',
          displayName: data.displayName || user.displayName || '',
          role: data.role || 'student',
          createdAt: data.createdAt?.toDate(),
        };

        // Only add photoURL if it exists
        if (data.photoURL || user.photoURL) {
          profile.photoURL = data.photoURL || user.photoURL;
        }

        return profile;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (user, displayName, role) => {
    try {
      const userProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: displayName || '',
        role: role || 'student',
        createdAt: new Date(),
      };

      // Only add photoURL if it exists and is not undefined
      if (user.photoURL) {
        userProfile.photoURL = user.photoURL;
      }

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, userProfile);

      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  // Sign up function
  const signUp = async (email, password, displayName, role) => {
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update the user's display name
      await updateProfile(credential.user, { displayName });

      // Send email verification
      await sendEmailVerification(credential.user);

      // Create user profile in Firestore
      const profile = await createUserProfile(
        credential.user,
        displayName,
        role
      );
      setUserProfile(profile);

      return credential;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return credential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Google Sign In function
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile exists, if not create one
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create profile for new Google user with default role
        await createUserProfile(user, user.displayName || 'User', 'student');
      }

      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Google Sign Up function (with role selection)
  const signUpWithGoogle = async (role = 'student') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create profile for new Google user with specified role
        await createUserProfile(user, user.displayName || 'User', role);
      }

      return result;
    } catch (error) {
      console.error('Error signing up with Google:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user);
      setUserProfile(profile);
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  // Update user password
  const updateUserPassword = async (newPassword) => {
    try {
      if (user) {
        await updatePassword(user, newPassword);
        return { success: true };
      }
      throw new Error('No user logged in');
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (displayName, photoURL) => {
    try {
      if (user) {
        // Prepare update data for Firebase Auth
        const authUpdate = {};
        if (displayName !== undefined) authUpdate.displayName = displayName;
        if (photoURL !== undefined) authUpdate.photoURL = photoURL;
        
        await updateProfile(user, authUpdate);
        
        // Prepare update data for Firestore (exclude undefined values)
        const firestoreUpdate = {
          updatedAt: new Date(),
        };
        if (displayName !== undefined) firestoreUpdate.displayName = displayName;
        if (photoURL !== undefined && photoURL !== null) firestoreUpdate.photoURL = photoURL;

        // Update Firestore profile
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, firestoreUpdate, { merge: true });

        // Refresh profile
        await refreshUserProfile();
        return { success: true };
      }
      throw new Error('No user logged in');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Send email verification
  const sendVerificationEmail = async () => {
    try {
      if (user) {
        await sendEmailVerification(user);
        return { success: true };
      }
      throw new Error('No user logged in');
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // Fetch user profile
        const profile = await fetchUserProfile(user);
        
        // If profile doesn't exist, create a basic one for existing users
        if (!profile) {
          try {
            const basicProfile = await createUserProfile(
              user, 
              user.displayName || 'User', 
              'student' // default role
            );
            setUserProfile(basicProfile);
          } catch (error) {
            console.error('Error creating basic profile:', error);
            setUserProfile(null);
          }
        } else {
          setUserProfile(profile);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signUpWithGoogle,
    logout,
    refreshUserProfile,
    resetPassword,
    updateUserPassword,
    updateUserProfile,
    sendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}