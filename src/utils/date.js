export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value) {
  const date = toDate(value);
  if (!date) return 'Not available';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getDaysRemaining(value) {
  const date = toDate(value);
  if (!date) return null;
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}
