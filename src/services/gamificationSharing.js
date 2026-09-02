import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase.js';

export async function getVerifiedChallengeShare(shareId) {
  try {
    const response = await httpsCallable(functions, 'getVerifiedChallengeShare')({ shareId });
    return response.data || { available: false, reason: 'unavailable' };
  } catch (error) {
    return {
      available: false,
      reason: 'unavailable',
      error: error?.message || 'This verified result is unavailable.',
    };
  }
}

export async function recordVerifiedChallengeShareOpen(shareId, visitorId) {
  try {
    const response = await httpsCallable(functions, 'recordVerifiedChallengeShareOpen')({ shareId, visitorId });
    return response.data || { success: false };
  } catch {
    return { success: false };
  }
}
