import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../config/firebase';

const AuthContext = createContext(null);

function buildTrialWindow() {
  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt);
  trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + 14);
  return { trialStartedAt, trialEndsAt };
}

function splitDisplayName(displayName = '') {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function getNamePartsFromDisplayName(displayName = '') {
  const { firstName, lastName } = splitDisplayName(displayName);
  return { firstName: firstName || null, lastName: lastName || null };
}

function buildUserProfile({
  user,
  firstName = null,
  lastName = null,
  displayName = null,
  phone = null,
  smsOptIn = false,
  smsConsentSource = null,
  authProvider = 'password',
}) {
  const { trialStartedAt, trialEndsAt } = buildTrialWindow();
  const cleanedPhone = phone?.trim() || null;
  const providerIds = user.providerData.map((provider) => provider.providerId);
  const appleProvider = user.providerData.find((provider) => provider.providerId === 'apple.com');

  return {
    email: user.email || null,
    firstName,
    lastName,
    displayName,
    phone: cleanedPhone,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    units: 'imperial',
    authProvider,
    authProviders: providerIds.length ? providerIds : [authProvider],
    appleUserId: appleProvider?.uid || null,
    contact: {
      emailVerified: user.emailVerified === true,
      phone: cleanedPhone,
      smsOptIn: smsOptIn === true,
      smsConsentAt: smsOptIn === true ? serverTimestamp() : null,
      smsConsentSource,
      smsVerificationStatus: smsOptIn === true ? 'pending' : 'not_collected',
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
      sms: smsOptIn === true,
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
  };
}

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

    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    await setDoc(
      doc(db, 'users', userCredential.user.uid),
      buildUserProfile({
        user: userCredential.user,
        firstName: firstName || null,
        lastName: lastName || null,
        displayName,
        phone,
        smsOptIn: true,
        smsConsentSource: 'web_signup',
        authProvider: 'email',
      })
    );

    await sendSageSetVerificationEmail();

    try {
      const sendSmsConfirmation = httpsCallable(functions, 'sendSmsConfirmation');
      await sendSmsConfirmation({ phone: phone.trim() });
    } catch (smsError) {
      console.warn('SMS confirmation could not be sent:', smsError);
    }

    await loadUserData(userCredential.user.uid);
    return userCredential.user;
  };

  const signInWithApple = async () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    const userCredential = await signInWithPopup(auth, provider);
    const currentUser = userCredential.user;
    const profileRef = doc(db, 'users', currentUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      const displayName = currentUser.displayName || '';
      const { firstName, lastName } = splitDisplayName(displayName);
      await setDoc(
        profileRef,
        buildUserProfile({
          user: currentUser,
          firstName,
          lastName,
          displayName: displayName || null,
          phone: null,
          smsOptIn: false,
          smsConsentSource: null,
          authProvider: 'apple',
        })
      );
    } else {
      await setDoc(
        profileRef,
        {
          email: currentUser.email || profileSnap.data()?.email || null,
          authProvider: profileSnap.data()?.authProvider || 'apple',
          authProviders: currentUser.providerData.map((providerData) => providerData.providerId),
          appleUserId: currentUser.providerData.find((providerData) => providerData.providerId === 'apple.com')?.uid || null,
          contact: {
            emailVerified: currentUser.emailVerified === true,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await loadUserData(currentUser.uid);
    return currentUser;
  };

  const refreshUserData = async () => {
    if (!auth.currentUser) return null;
    return await loadUserData(auth.currentUser.uid);
  };

  const sendSageSetVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error('No signed-in user.');
    }
    await auth.currentUser.getIdToken(true);
    const sendVerificationEmail = httpsCallable(functions, 'sendVerificationEmail');
    const result = await sendVerificationEmail({});
    return result.data;
  };

  const completeProfileSetup = async ({ displayName = '', phone = '', smsOptIn = false }) => {
    if (!auth.currentUser) {
      throw new Error('No signed-in user.');
    }
    const cleanedDisplayName = displayName.trim();
    const cleanedPhone = phone.trim();
    if (!cleanedDisplayName) {
      throw new Error('Display name is required.');
    }
    if (!cleanedPhone) {
      throw new Error('Mobile phone number is required.');
    }
    if (smsOptIn !== true) {
      throw new Error('SMS opt-in is required so SageSet can send account and status updates.');
    }

    const { firstName, lastName } = getNamePartsFromDisplayName(cleanedDisplayName);
    await updateProfile(auth.currentUser, { displayName: cleanedDisplayName });
    await setDoc(
      doc(db, 'users', auth.currentUser.uid),
      {
        email: auth.currentUser.email || userData?.email || null,
        firstName,
        lastName,
        displayName: cleanedDisplayName,
        phone: cleanedPhone,
        contact: {
          emailVerified: auth.currentUser.emailVerified === true,
          phone: cleanedPhone,
          smsOptIn: true,
          smsConsentAt: serverTimestamp(),
          smsConsentSource: 'web_complete_profile',
          smsVerificationStatus: 'pending',
        },
        notificationPreferences: {
          ...(userData?.notificationPreferences || {}),
          sms: true,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const sendSmsConfirmation = httpsCallable(functions, 'sendSmsConfirmation');
    const result = await sendSmsConfirmation({ phone: cleanedPhone });
    await loadUserData(auth.currentUser.uid);
    return result.data;
  };

  const refreshAuthUser = async () => {
    if (!auth.currentUser) return null;
    await auth.currentUser.reload();
    const refreshedUser = auth.currentUser;
    setUser(refreshedUser);
    if (refreshedUser?.emailVerified) {
      await setDoc(
        doc(db, 'users', refreshedUser.uid),
        {
          contact: {
            emailVerified: true,
            emailVerifiedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await loadUserData(refreshedUser.uid);
    }
    return refreshedUser;
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error('No signed-in user.');
    }
    await sendSageSetVerificationEmail();
  };

  const resendSmsVerification = async () => {
    if (!auth.currentUser) {
      throw new Error('No signed-in user.');
    }
    const phone = userData?.contact?.phone || userData?.phone || '';
    if (!phone) {
      throw new Error('No mobile phone number is on file.');
    }
    const sendSmsConfirmation = httpsCallable(functions, 'sendSmsConfirmation');
    const result = await sendSmsConfirmation({ phone });
    await refreshUserData();
    return result.data;
  };

  const verifySmsCode = async (code) => {
    if (!auth.currentUser) {
      throw new Error('No signed-in user.');
    }
    const verifySmsConfirmation = httpsCallable(functions, 'verifySmsConfirmation');
    const result = await verifySmsConfirmation({ code });
    await refreshUserData();
    return result.data;
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
    signInWithApple,
    logout,
    resetPassword,
    refreshUserData,
    completeProfileSetup,
    refreshAuthUser,
    resendVerificationEmail,
    resendSmsVerification,
    verifySmsCode,
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
