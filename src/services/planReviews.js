import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db, functions } from '../config/firebase.js';

const requestPlanReviewCallable = httpsCallable(functions, 'requestPlanReview');
const acceptPlanReviewCallable = httpsCallable(functions, 'acceptPlanReview');
const dismissPlanReviewCallable = httpsCallable(functions, 'dismissPlanReview');

export async function requestPlanReview({ force = false } = {}) {
  const result = await requestPlanReviewCallable({
    force,
    todayString: toLocalDateString(new Date()),
  });
  return result.data || {};
}

export async function acceptPlanReview(reviewId) {
  const result = await acceptPlanReviewCallable({
    reviewId,
    effectiveFromDate: toLocalDateString(new Date()),
  });
  return result.data || {};
}

export async function dismissPlanReview(reviewId) {
  const result = await dismissPlanReviewCallable({ reviewId });
  return result.data || {};
}

export async function loadRecentPlanReviews(uid, maxCount = 5) {
  if (!uid) return [];
  const snapshot = await getDocs(
    query(
      collection(db, 'users', uid, 'planAdjustmentReviews'),
      orderBy('createdAt', 'desc'),
      limit(Math.max(1, Math.min(10, Number(maxCount) || 5)))
    )
  );
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

function toLocalDateString(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
