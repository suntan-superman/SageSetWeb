import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';

export async function loadPublicFeatureRollout() {
  const callable = httpsCallable(functions, 'getARChallengeRollout');
  const result = await callable({});
  return result?.data || null;
}

export async function updateProductUpdatePreference(uid, enabled) {
  if (!uid) throw new Error('A signed-in user is required.');
  await updateDoc(doc(db, 'users', uid), {
    'notificationPreferences.marketing': enabled === true,
    'notificationPreferences.marketingUpdatedAt': serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
