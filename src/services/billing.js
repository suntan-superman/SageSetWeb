import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { trackCustomEvent, trackEvent } from './metaPixel';

export async function loadBillingStatus() {
  const fn = httpsCallable(functions, 'getBillingStatus');
  const response = await fn({});
  return response?.data || {};
}

export async function refreshEntitlements() {
  const fn = httpsCallable(functions, 'refreshEntitlements');
  const response = await fn({});
  return response?.data || {};
}

export async function startCheckout() {
  const fn = httpsCallable(functions, 'createCheckoutSession');
  const response = await fn({ returnPath: '/dashboard/billing' });
  const url = response?.data?.url;
  if (!url) throw new Error('Checkout URL was not returned.');
  trackCustomEvent('TrialStarted', { source: 'dashboard_billing', value: 9.99, currency: 'USD' });
  window.location.assign(url);
}

export async function openCustomerPortal() {
  const fn = httpsCallable(functions, 'createPortalSession');
  const response = await fn({ returnPath: '/dashboard/billing' });
  const url = response?.data?.url;
  if (!url) throw new Error('Billing portal URL was not returned.');
  trackEvent('Lead', { content_name: 'customer_portal_opened' });
  window.location.assign(url);
}
