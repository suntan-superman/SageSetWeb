import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadUserData = async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.exists() ? snap.data() : null;
    setUserData(data);
    return data;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Force a fresh token on admin portal bootstrap so callable functions
        // and route guards agree on the latest custom claims.
        const tokenResult = await user.getIdTokenResult(true);
        const adminClaim = tokenResult.claims.admin === true;
        setIsAdmin(adminClaim);
        setUser(user);
        await loadUserData(user.uid);
      } else {
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await loadUserData(userCredential.user.uid);
    return userCredential.user;
  };

  const loginAdmin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const tokenResult = await userCredential.user.getIdTokenResult(true);
    const adminClaim = tokenResult.claims.admin === true;
    
    if (!adminClaim) {
      await signOut(auth);
      throw new Error('Access denied. Admin privileges required.');
    }
    
    return userCredential.user;
  };

  const signup = async ({ email, password, firstName = '', lastName = '', phone = '', smsOptIn = false }) => {
    if (!phone.trim()) {
      throw new Error('Phone number is required.');
    }
    if (smsOptIn !== true) {
      throw new Error('SMS opt-in is required so SageSet can send account and status updates.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = `${firstName} ${lastName}`.trim() || null;
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt);
    trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + 14);

    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      displayName,
      phone: phone.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      units: 'imperial',
      contact: {
        emailVerified: false,
        phone: phone.trim(),
        smsOptIn: true,
        smsConsentAt: serverTimestamp(),
        smsConsentSource: 'web_signup',
        smsVerificationStatus: 'pending',
      },
      trial: {
        startedAt: Timestamp.fromDate(trialStartedAt),
        endsAt: Timestamp.fromDate(trialEndsAt),
        status: 'active',
        source: 'account_creation',
        dayNumber: 1,
      },
      subscription: {
        provider: 'stripe',
        status: 'none',
        source: null,
        plan: 'free',
        planId: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        lastVerifiedAt: null,
      },
      entitlements: {
        premium: true,
        nutritionAnalysis: true,
        aiWorkoutGeneration: true,
        progressTracking: true,
        advancedAnalytics: false,
        arkitChallenges: false,
      },
      notificationPreferences: {
        email: true,
        push: true,
        marketing: false,
        sms: true,
        trialReminders: true,
      },
      metrics: {
        workoutsCompleted: 0,
        mealsLogged: 0,
        mealAnalysesUsed: 0,
        streakDays: 0,
        weightEntries: 0,
        lastWorkoutAt: null,
        lastMealLoggedAt: null,
      },
      featureFlags: {
        arkitChallengesEnabled: false,
      },
    });

    await sendEmailVerification(userCredential.user);

    try {
      const sendSmsConfirmation = httpsCallable(functions, 'sendSmsConfirmation');
      await sendSmsConfirmation({ phone: phone.trim() });
    } catch (smsError) {
      console.warn('SMS confirmation could not be sent:', smsError);
    }

    await loadUserData(userCredential.user.uid);
    return userCredential.user;
  };

  const refreshUserData = async () => {
    if (!auth.currentUser) return null;
    return await loadUserData(auth.currentUser.uid);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    userData,
    isAdmin,
    loading,
    login,
    loginAdmin,
    signup,
    logout,
    resetPassword,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
