
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

interface UserData {
  tokens: number;
  usedTokens: number;
  subscription: 'free' | 'pro' | 'premium';
  email: string;
  displayName: string;
  isFirstLogin?: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateTokens: (tokensUsed: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      setUser(user);
      if (user) {
        await loadUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      console.log('Loading user data for:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        console.log('User data loaded:', data);
        setUserData(data);
        
        // Award 10 tokens on first login only
        if (data.isFirstLogin) {
          const updatedTokens = data.tokens + 10;
          await updateDoc(doc(db, 'users', uid), {
            tokens: updatedTokens,
            isFirstLogin: false
          });
          
          setUserData({
            ...data,
            tokens: updatedTokens,
            isFirstLogin: false
          });
          console.log('First login bonus awarded:', updatedTokens);
        }
      } else {
        console.log('User document does not exist');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const createUserDocument = async (user: User, displayName?: string) => {
    const userData: UserData = {
      tokens: 5, // Free users get 5 tokens
      usedTokens: 0,
      subscription: 'free',
      email: user.email || '',
      displayName: displayName || user.displayName || 'User',
      isFirstLogin: true // Mark as first login to award bonus tokens
    };

    console.log('Creating user document:', userData);
    await setDoc(doc(db, 'users', user.uid), userData);
    setUserData(userData);
  };

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    console.log('Signing up new user');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDocument(result.user, displayName);
  };

  const signInWithGoogle = async () => {
    console.log('Signing in with Google');
    const result = await signInWithPopup(auth, googleProvider);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await createUserDocument(result.user);
    }
  };

  const logout = async () => {
    console.log('Logging out user');
    await signOut(auth);
  };

  const updateTokens = async (tokensUsed: number) => {
    if (!user || !userData) return;

    // For free users, don't limit token usage - they have unlimited usage of their 5 tokens
    if (userData.subscription === 'free') {
      console.log('Free user - tokens used but not depleted');
      return;
    }

    const newUsedTokens = userData.usedTokens + tokensUsed;
    await updateDoc(doc(db, 'users', user.uid), {
      usedTokens: newUsedTokens
    });

    setUserData({
      ...userData,
      usedTokens: newUsedTokens
    });
    console.log('Tokens updated:', newUsedTokens);
  };

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateTokens
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
