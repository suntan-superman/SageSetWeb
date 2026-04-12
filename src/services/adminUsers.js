import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export async function listUsersForAdmin(limit = 250) {
  const fn = httpsCallable(functions, 'listUsersForAdmin');
  const result = await fn({ limit });
  return result?.data || { users: [], total: 0 };
}

export async function getUserAdminDetail(uid) {
  const fn = httpsCallable(functions, 'getUserAdminDetail');
  const result = await fn({ uid });
  return result?.data || null;
}

export async function sendUserExpoNotification({ uid, title, body, data = {} }) {
  const fn = httpsCallable(functions, 'sendUserExpoNotification');
  const result = await fn({ uid, title, body, data });
  return result?.data || null;
}
