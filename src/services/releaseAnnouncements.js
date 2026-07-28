import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../config/firebase';

let lastTokenRefreshAt = 0;

async function callAdminFunction(name, payload) {
  const user = auth.currentUser;
  if (!user) throw new Error('Admin authentication is required.');
  if (Date.now() - lastTokenRefreshAt > 60_000) {
    await user.getIdToken(true);
    lastTokenRefreshAt = Date.now();
  }
  const callable = httpsCallable(functions, name);
  const result = await callable(payload);
  return result?.data || null;
}

export async function previewReleaseAnnouncement(payload) {
  return callAdminFunction('previewReleaseAnnouncement', payload);
}

export async function sendReleaseAnnouncement(payload) {
  return callAdminFunction('sendReleaseAnnouncement', payload);
}

export async function listReleaseAnnouncements(limit = 20) {
  return (
    (await callAdminFunction('listReleaseAnnouncementsForAdmin', { limit })) || {
      announcements: [],
    }
  );
}
