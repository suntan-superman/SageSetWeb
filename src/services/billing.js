import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { trackCustomEvent, trackEvent } from './metaPixel';
import { trackWorksideEvent } from './worksideAnalytics.js';
import { runtimeEnvironment } from '../config/runtimeEnvironment.js';

function assertApprovedCheckoutUrl(value) {
  let parsed;
  try { parsed = new URL(value); }
  catch { throw new Error('Checkout returned an invalid URL.'); }
  if (runtimeEnvironment.isStaging &&
      (parsed.protocol !== 'https:' || parsed.hostname !== runtimeEnvironment.stripeCheckoutHost)) {
    throw new Error('Checkout returned a destination that is not approved for staging.');
  }
  return parsed.toString();
}

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
  void trackWorksideEvent('checkout_started', { plan: 'sageset_premium' });
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
  window.location.assign(assertApprovedCheckoutUrl(url));
}

export async function openCustomerPortal() {
  void trackWorksideEvent('customer_portal_opened', { placement: 'dashboard_billing' });
  const fn = httpsCallable(functions, 'createPortalSession');
  const response = await fn({ returnPath: '/dashboard/billing' });
  const url = response?.data?.url;
  if (!url) throw new Error('Billing portal URL was not returned.');
  trackEvent('Lead', { content_name: 'customer_portal_opened' });
  window.location.assign(assertApprovedCheckoutUrl(url));
}
