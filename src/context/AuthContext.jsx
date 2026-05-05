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
import { doc, setDoc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const addEmployee = async (email, fullName, role = 'employee') => {
    const sAuth = getSecondaryAuth();
    const userCredential = await createUserWithEmailAndPassword(sAuth, email, email);
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });

    const userDoc = {
      uid: user.uid,
      email,
      fullName,
      role: email === SUPER_ADMIN_EMAIL ? 'superadmin' : role,
      createdAt: new Date().toISOString(),
      dept: 'Unassigned',
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
        const attempts = snap.exists() ? (snap.data().failedAttempts || 0) + 1 : 1;
        
        let lockoutUntil = null;
        if (attempts >= 3) {
          lockoutUntil = Timestamp.fromDate(new Date(Date.now() + 30 * 60000));
        }

        await setDoc(statusRef, { 
          failedAttempts: attempts, 
          lockoutUntil: lockoutUntil,
          lastAttempt: Timestamp.now()
        }, { merge: true });

        if (attempts >= 3) {
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
      setCurrentUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
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
             role: user.email === SUPER_ADMIN_EMAIL ? 'superadmin' : 'employee',
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
      setLoading(false);
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

  const value = {
    currentUser,
    userData,
    addEmployee,
    updateUserPassword,
    updateUserProfile,
    resetPassword,
    login,
    logout,
    loginWithGoogle,
    isSuperAdmin: userData?.role === 'superadmin' || currentUser?.email === SUPER_ADMIN_EMAIL,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
