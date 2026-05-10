import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, Timestamp, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
// Firebase Storage is being migrated to Cloudinary
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloudinaryConfig, setCloudinaryConfig] = useState({
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  });

  const SUPER_ADMIN_EMAIL = 'sahildev212@gmail.com';

  // Initialize Secondary Auth only when needed to avoid config errors on load
  const getSecondaryAuth = () => {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    
    let secondaryApp;
    if (getApps().find(app => app.name === 'Secondary')) {
      secondaryApp = getApp('Secondary');
    } else {
      secondaryApp = initializeApp(firebaseConfig, 'Secondary');
    }
    return getAuth(secondaryApp);
  };

  const addEmployee = async (email, fullName, designation = 'Developer', role = 'staff', dept = 'Unassigned', salary = '0') => {
    const sAuth = getSecondaryAuth();
    const userCredential = await createUserWithEmailAndPassword(sAuth, email, email);
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });

    const userDoc = {
      uid: user.uid,
      email,
      fullName,
      role: email === SUPER_ADMIN_EMAIL ? 'superadmin' : role,
      designation,
      createdAt: new Date().toISOString(),
      dept,
      salary,
      status: 'Active',
      failedAttempts: 0,
      lockoutUntil: null
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);
    await signOut(sAuth);
    return user;
  };

  const updateUserPassword = async (newPassword) => {
    if (auth.currentUser) {
      return updatePassword(auth.currentUser, newPassword);
    }
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const login = async (email, password) => {
    // 1. Check lockout status from Firestore
    // Note: We use a try/catch here because if rules are strict, this might fail before auth
    try {
      const statusRef = doc(db, 'login_status', email);
      const statusSnap = await getDoc(statusRef);

      if (statusSnap.exists()) {
        const data = statusSnap.data();
        if (data.lockoutUntil && data.lockoutUntil.toDate() > new Date()) {
          const remaining = Math.ceil((data.lockoutUntil.toDate() - new Date()) / 60000);
          throw new Error(`Account locked. Try again in ${remaining} minutes.`);
        }
      }
    } catch (e) {
      console.warn("Lockout check skipped or failed:", e.message);
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Reset failed attempts on success
      const statusRef = doc(db, 'login_status', email);
      await setDoc(statusRef, { failedAttempts: 0, lockoutUntil: null }, { merge: true });
      return result;
    } catch (error) {
      console.error("Firebase Auth Error:", error.code, error.message);
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        const statusRef = doc(db, 'login_status', email);
        const snap = await getDoc(statusRef);
        
        let attempts = 1;
        if (snap.exists()) {
          const data = snap.data();
          const lastAttempt = data.lastAttempt?.toDate() || new Date(0);
          const hoursSinceLastAttempt = (new Date() - lastAttempt) / 3600000;
          
          // Reset counter if last attempt was more than 24 hours ago
          if (hoursSinceLastAttempt > 24) {
            attempts = 1;
          } else {
            attempts = (data.failedAttempts || 0) + 1;
          }
        }
        
        let lockoutUntil = null;
        if (attempts >= 5) {
          lockoutUntil = Timestamp.fromDate(new Date(Date.now() + 30 * 60000));
        }

        await setDoc(statusRef, { 
          failedAttempts: attempts, 
          lockoutUntil: lockoutUntil,
          lastAttempt: Timestamp.now()
        }, { merge: true });

        if (attempts >= 5) {
          throw new Error('Too many failed attempts. Account locked for 30 minutes.');
        }
      }
      
      if (error.code === 'auth/configuration-not-found') {
        throw new Error('Firebase Authentication is not fully configured. Please enable "Email/Password" and "Google" in your Firebase Console.');
      }
      
      throw error;
    }
  };

  const logout = () => {
    setUserData(null);
    return signOut(auth);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          // Fetch dynamic configs
          const cloudSnap = await getDoc(doc(db, 'settings', 'cloudinary'));
          if (cloudSnap.exists()) {
            setCloudinaryConfig(cloudSnap.data());
          }

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (user.email === SUPER_ADMIN_EMAIL && data.role !== 'superadmin') {
              await updateDoc(docRef, { role: 'superadmin' });
              setUserData({ ...data, role: 'superadmin' });
            } else {
              setUserData(data);
            }
          } else {
            // If user exists in Auth but not in Firestore (e.g. first Google Login)
            const newUserDoc = {
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || 'New User',
              role: user.email === SUPER_ADMIN_EMAIL ? 'superadmin' : 'staff',
              designation: 'Developer',
              createdAt: new Date().toISOString(),
              dept: 'Unassigned',
              status: 'Active'
            };
            await setDoc(docRef, newUserDoc);
            setUserData(newUserDoc);
          }
        } else {
          setUserData(null);
        }
      } catch (err) {
        console.error("Error in onAuthStateChanged:", err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const updateUserProfile = async (data) => {
    if (!auth.currentUser) return;
    
    // 1. Update Firebase Auth Profile
    if (data.fullName) {
      await updateProfile(auth.currentUser, { displayName: data.fullName });
    }

    // 2. Update Firestore User Document
    const docRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    // 3. Update local state
    setUserData(prev => ({ ...prev, ...data }));
  };

  const uploadUserDocument = async (file, fileName, fileType, onProgress) => {
    if (!auth.currentUser) return;

    const cloudName = cloudinaryConfig.cloudName;
    const uploadPreset = cloudinaryConfig.uploadPreset;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    // OVERWRITE LOGIC: 
    // We use a fixed public_id for the user's document to ensure the old file is overwritten in Cloudinary.
    // 'auto' resource_type allows handling PDFs, images, etc. under the same ID.
    formData.append('public_id', `doc_${auth.currentUser.uid}`);
    formData.append('folder', 'user_documents');
    formData.append('invalidate', 'true'); // Clears CDN cache for the old file

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Document upload failed');
      }

      const data = await response.json();
      const downloadURL = data.secure_url;
      
      const docData = {
        name: fileName,
        type: fileType,
        url: downloadURL,
        publicId: data.public_id,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        createdAt: new Date().toISOString()
      };

      // Use setDoc with a fixed ID 'latest' to overwrite the Firestore metadata
      // This ensures only one document record exists per user, satisfying "old dlt"
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'documents', 'latest'), docData);
      
      return downloadURL;
    } catch (error) {
      console.error("Cloudinary Document Upload Error:", error);
      throw error;
    }
  };

  const updateProfileImage = async (file) => {
    if (!auth.currentUser) return;

    const cloudName = cloudinaryConfig.cloudName;
    const uploadPreset = cloudinaryConfig.uploadPreset;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    // IMPORTANT: Overwrite logic
    // Using the user's UID as the public_id ensures the old image is overwritten
    // Note: Cloudinary requires "Allow public_id in unsigned uploads" to be enabled in settings
    formData.append('public_id', `profile_${auth.currentUser.uid}`);
    formData.append('folder', 'profile_images');
    formData.append('invalidate', 'true'); // Tells Cloudinary to clear cache for the old image

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Profile image upload failed');
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      // Update Firestore and Auth Profile
      await updateProfile(auth.currentUser, { photoURL: imageUrl });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: imageUrl,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setUserData(prev => ({ ...prev, photoURL: imageUrl }));
      
      return imageUrl;
    } catch (error) {
      console.error("Cloudinary Profile Upload Error:", error);
      throw error;
    }
  };

  const deleteUserDocument = async (docId, publicId) => {
    if (!auth.currentUser) return;

    // Note: Unsigned deletion from frontend is restricted for security.
    // We remove the record from Firestore. The file remains in Cloudinary 
    // unless manually deleted or handled by a backend proxy.
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'documents', docId));
  };

  const value = {
    currentUser,
    userData,
    addEmployee,
    updateUserPassword,
    updateUserProfile,
    uploadUserDocument,
    updateProfileImage,
    deleteUserDocument,
    resetPassword,
    login,
    logout,
    loginWithGoogle,
    isSuperAdmin: userData?.role === 'superadmin' || currentUser?.email === SUPER_ADMIN_EMAIL,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
