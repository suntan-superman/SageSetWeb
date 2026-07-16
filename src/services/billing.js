import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { trackCustomEvent, trackEvent } from './metaPixel';
import { trackWorksideEvent } from './worksideAnalytics.js';

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
  void trackWorksideEvent('checkout_started', { plan: 'sageset_premium', currency: 'USD', value: 9.99 });
  trackEvent('InitiateCheckout', {
    content_name: 'SageSet Premium',
    content_category: 'subscription',
    currency: 'USD',
    value: 9.99,
    num_items: 1,
  });
  const fn = httpsCallable(functions, 'createCheckoutSession');
  const response = await fn({ returnPath: '/dashboard/billing' });
  const url = response?.data?.url;
  if (!url) throw new Error('Checkout URL was not returned.');
  trackCustomEvent('CheckoutSessionCreated', { source: 'dashboard_billing', value: 9.99, currency: 'USD' });
  window.location.assign(url);
}

export async function openCustomerPortal() {
  void trackWorksideEvent('customer_portal_opened', { placement: 'dashboard_billing' });
  const fn = httpsCallable(functions, 'createPortalSession');
  const response = await fn({ returnPath: '/dashboard/billing' });
  const url = response?.data?.url;
  if (!url) throw new Error('Billing portal URL was not returned.');
  trackEvent('Lead', { content_name: 'customer_portal_opened' });
  window.location.assign(url);
}
