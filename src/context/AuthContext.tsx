import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoAdmin: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEMO_AUTH_STORAGE_KEY = 'kav_demo_admin_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isDemo = !isFirebaseConfigured();

  useEffect(() => {
    // 1. Restore local session if exists
    const savedDemo = sessionStorage.getItem(DEMO_AUTH_STORAGE_KEY);
    if (savedDemo) {
      try {
        setUser(JSON.parse(savedDemo));
      } catch {
        sessionStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
      }
    }

    // 2. Firebase Auth state listener
    if (isFirebaseConfigured() && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          // If logged in as official owner email
          if (fbUser.email?.toLowerCase() === 'krishnaagrovet@gmail.com') {
            const ownerProfile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email,
              full_name: fbUser.displayName || 'Krishna Agrovet Store Owner',
              role: 'admin',
            };
            setUser(ownerProfile);
            sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(ownerProfile));
            setLoading(false);
            return;
          }

          try {
            let isAdminUser = false;
            let fullName = fbUser.displayName || 'Owner Administrator';

            if (db) {
              const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
              if (adminDoc.exists()) {
                isAdminUser = true;
                fullName = adminDoc.data()?.full_name || fullName;
              } else {
                const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
                if (userDoc.exists() && userDoc.data()?.role === 'admin') {
                  isAdminUser = true;
                  fullName = userDoc.data()?.full_name || fullName;
                }
              }
            }

            if (isAdminUser) {
              const adminProfile: UserProfile = {
                id: fbUser.uid,
                email: fbUser.email || '',
                full_name: fullName,
                role: 'admin',
              };
              setUser(adminProfile);
              sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(adminProfile));
            } else if (!sessionStorage.getItem(DEMO_AUTH_STORAGE_KEY)) {
              setUser(null);
            }
          } catch (err) {
            console.error('Error verifying Firebase admin profile:', err);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [isDemo]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isOwnerCreds = (
      cleanEmail === 'krishnaagrovet@gmail.com' &&
      password === 'Krishna@169#'
    );

    // Primary Owner Credentials match
    if (isOwnerCreds) {
      const ownerUser: UserProfile = {
        id: 'usr-krishna-agrovet-owner',
        email: 'krishnaagrovet@gmail.com',
        full_name: 'Krishna Agrovet Store Owner',
        role: 'admin',
      };
      sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(ownerUser));
      setUser(ownerUser);

      // Also sync to Firebase Auth if configured
      if (isFirebaseConfigured() && auth) {
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        } catch (authErr: any) {
          // If account doesn't exist in Firebase Auth yet, automatically register it!
          if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
            try {
              await createUserWithEmailAndPassword(auth, cleanEmail, password);
            } catch {
              // Ignore if self-registration is disabled in Firebase console
            }
          }
        }
      }

      return { success: true };
    }

    // Standard Firebase Auth sign in
    if (isFirebaseConfigured() && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;

        let isAdminUser = (fbUser.email?.toLowerCase() === 'krishnaagrovet@gmail.com');
        let fullName = fbUser.displayName || 'Owner Administrator';

        if (!isAdminUser && db) {
          const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
          if (adminDoc.exists()) {
            isAdminUser = true;
            fullName = adminDoc.data()?.full_name || fullName;
          } else {
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            if (userDoc.exists() && userDoc.data()?.role === 'admin') {
              isAdminUser = true;
              fullName = userDoc.data()?.full_name || fullName;
            }
          }
        }

        if (!isAdminUser) {
          await firebaseSignOut(auth);
          return {
            success: false,
            error: 'Access denied: This user account does not possess owner administrator privileges.',
          };
        }

        const adminUser: UserProfile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          full_name: fullName,
          role: 'admin',
        };
        sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(adminUser));
        setUser(adminUser);

        return { success: true };
      } catch (err: any) {
        console.error('Firebase Auth sign in error:', err);
        return { success: false, error: err.message || 'Firebase authentication failed' };
      }
    }

    // Secondary demo credentials
    if (
      (cleanEmail === 'admin@krishnaagrovet.com' || cleanEmail === 'admin') &&
      password === 'admin123'
    ) {
      const demoUser: UserProfile = {
        id: 'usr-demo-admin-01',
        email: 'krishnaagrovet@gmail.com',
        full_name: 'Krishna Agrovet Store Owner',
        role: 'admin',
      };
      sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please use email: krishnaagrovet@gmail.com and password: Krishna@169#',
    };
  };

  const loginAsDemoAdmin = () => {
    const ownerUser: UserProfile = {
      id: 'usr-krishna-agrovet-owner',
      email: 'krishnaagrovet@gmail.com',
      full_name: 'Krishna Agrovet Store Owner',
      role: 'admin',
    };
    sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(ownerUser));
    setUser(ownerUser);
  };

  const logout = async () => {
    if (isFirebaseConfigured() && auth) {
      await firebaseSignOut(auth);
    }
    sessionStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'admin',
        isDemoMode: isDemo,
        login,
        loginAsDemoAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
