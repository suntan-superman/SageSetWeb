import { httpsCallable } from 'firebase/functions';
import { getBlob, ref } from 'firebase/storage';
import { auth, functions, storage } from '../config/firebase';

const ADMIN_TOKEN_REFRESH_TTL_MS = 60 * 1000;
let lastAdminTokenRefreshAt = 0;

function isAdminPermissionError(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '');

  return (
    code === 'functions/permission-denied' ||
    code === 'permission-denied' ||
    message.includes('Only admins can perform this action')
  );
}

async function ensureFreshAdminToken({ force = false } = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const shouldRefresh =
    force || Date.now() - lastAdminTokenRefreshAt > ADMIN_TOKEN_REFRESH_TTL_MS;

  if (!shouldRefresh) return;

  await currentUser.getIdToken(true);
  lastAdminTokenRefreshAt = Date.now();
}

async function callAdminFunction(name, payload) {
  const fn = httpsCallable(functions, name);

  await ensureFreshAdminToken();

  try {
    const result = await fn(payload);
    return result?.data ?? null;
  } catch (error) {
    if (!isAdminPermissionError(error)) {
      throw error;
    }

    await ensureFreshAdminToken({ force: true });
    const retryResult = await fn(payload);
    return retryResult?.data ?? null;
  }
}

export async function listUsersForAdmin(limit = 250) {
  return (
    (await callAdminFunction('listUsersForAdmin', { limit })) || {
      users: [],
      total: 0,
    }
  );
}

export async function getUserAdminDetail(uid) {
  return await callAdminFunction('getUserAdminDetail', { uid });
}

export async function loadARSessionReviewBlob(storagePath) {
  if (!String(storagePath || '').startsWith('ar-session-reviews/')) {
    throw new Error('Invalid AR session review path.');
  }
  await ensureFreshAdminToken();
  return getBlob(ref(storage, storagePath), 150 * 1024 * 1024);
}

export async function getUserAdminPlanDetail(uid, planId) {
  return await callAdminFunction('getUserAdminPlanDetail', { uid, planId });
}

export async function sendUserExpoNotification({ uid, title, body, data = {} }) {
  return await callAdminFunction('sendUserExpoNotification', {
    uid,
    title,
    body,
    data,
  });
}

export async function listNutritionUsageForAdmin(limit = 100) {
  return (
    (await callAdminFunction('listNutritionUsageForAdmin', { limit })) || {
      users: [],
      total: 0,
    }
  );
}

export async function updateUserAccessForAdmin({ uid, action, notifyUser = false }) {
  return await callAdminFunction('updateUserAccessForAdmin', {
    uid,
    action,
    notifyUser,
  });
}

export async function getARChallengeRolloutForAdmin() {
  return await callAdminFunction('getARChallengeRollout', {});
}

export async function updateARChallengeRolloutForAdmin({ enabled, publicFeatures }) {
  return await callAdminFunction('updateARChallengeRolloutForAdmin', {
    ...(typeof enabled === 'boolean' ? { enabled } : {}),
    ...(publicFeatures ? { publicFeatures } : {}),
  });
}

export async function getSprintCoachRolloutForAdmin() {
  return await callAdminFunction('getSprintCoachAccessForAdmin', {});
}

export async function updateSprintCoachRolloutForAdmin(payload) {
  return await callAdminFunction('updateSprintCoachRolloutForAdmin', payload);
}

export async function updateSprintCoachUserAccessForAdmin({
  uid,
  accessLevel,
  notes = '',
  notifyUser = false,
}) {
  return await callAdminFunction('updateSprintCoachUserAccessForAdmin', {
    uid,
    accessLevel,
    notes,
    notifyUser,
  });
}
