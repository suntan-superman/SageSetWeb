import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../config/firebase';

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

export async function sendUserExpoNotification({ uid, title, body, data = {} }) {
  return await callAdminFunction('sendUserExpoNotification', {
    uid,
    title,
    body,
    data,
  });
}
