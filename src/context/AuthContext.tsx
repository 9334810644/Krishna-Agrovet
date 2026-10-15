import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
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
    if (isFirebaseConfigured() && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          try {
            // Verify admin status from Firestore 'admins' or 'users' collection
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
              setUser({
                id: fbUser.uid,
                email: fbUser.email || '',
                full_name: fullName,
                role: 'admin',
              });
            } else {
              setUser(null);
            }
          } catch (err) {
            console.error('Error verifying Firebase admin profile:', err);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Local demo mode check
      const savedDemo = sessionStorage.getItem(DEMO_AUTH_STORAGE_KEY);
      if (savedDemo) {
        try {
          setUser(JSON.parse(savedDemo));
        } catch {
          sessionStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
        }
      }
      setLoading(false);
    }
  }, [isDemo]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseConfigured() && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = userCredential.user;

        // Verify admin role
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

        if (!isAdminUser) {
          await firebaseSignOut(auth);
          return {
            success: false,
            error: 'Access denied: This user account does not possess owner administrator privileges in Firestore.',
          };
        }

        setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          full_name: fullName,
          role: 'admin',
        });

        return { success: true };
      } catch (err: any) {
        console.error('Firebase Auth sign in error:', err);
        return { success: false, error: err.message || 'Firebase authentication failed' };
      }
    }

    // Demo Mode fallback login
    if (
      (email.trim().toLowerCase() === 'admin@krishnaagrovet.com' || email.trim().toLowerCase() === 'admin') &&
      password === 'admin123'
    ) {
      const demoUser: UserProfile = {
        id: 'usr-demo-admin-01',
        email: 'admin@krishnaagrovet.com',
        full_name: 'Krishna Agrovet Store Owner',
        role: 'admin',
      };
      sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid credentials. For demo access use email: admin@krishnaagrovet.com and password: admin123',
    };
  };

  const loginAsDemoAdmin = () => {
    const demoUser: UserProfile = {
      id: 'usr-demo-admin-01',
      email: 'admin@krishnaagrovet.com',
      full_name: 'Krishna Agrovet Store Owner',
      role: 'admin',
    };
    sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
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
