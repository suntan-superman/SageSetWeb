import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase.js';

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

function toLocalDateString(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
