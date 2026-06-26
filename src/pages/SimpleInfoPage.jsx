import { useEffect } from 'react';
import { trackCustomEvent, trackEvent } from '../services/metaPixel';

const pageCopy = {
  '/testimonials': {
    title: 'Member stories',
    body: 'SageSet is early, but the product direction is clear: help users finish the workout, log the meal, and return tomorrow with less friction.',
  },
  '/before-after': {
    title: 'Before and after',
    body: 'Future transformation stories should emphasize consistency, completed workouts, nutrition habits, and realistic progress rather than exaggerated claims.',
  },
  '/faq': {
    title: 'Frequently asked questions',
    body: 'SageSet Premium is planned at $9.99/month after a 14-day free trial. AI nutrition estimates are approximate and designed to support, not replace, user judgment.',
  },
  '/supported-devices': {
    title: 'Supported devices',
    body: 'SageSet is built mobile-first for iPhone and Android. AR workout experiences remain feature-flagged while device support matures.',
  },
  '/blog': {
    title: 'SageSet blog',
    body: 'Launch content will focus on workout consistency, simple nutrition logging, streak psychology, and practical plan design.',
  },
  '/billing/success': {
    title: 'Trial started',
    body: 'Your billing session is complete. Return to the SageSet app and refresh billing status if the new subscription is not visible yet.',
  },
  '/billing/cancel': {
    title: 'Checkout canceled',
    body: 'No changes were made. You can return to SageSet and start the free trial whenever you are ready.',
  },
  '/account/billing': {
    title: 'Billing',
    body: 'Billing is managed through Stripe. Open SageSet on your mobile device to launch the customer portal for your account.',
  },
};

export default function SimpleInfoPage({ path }) {
  const content = pageCopy[path] || {
    title: 'SageSet',
    body: 'A focused fitness app for plans, workouts, nutrition, and consistency.',
  };

  useEffect(() => {
    if (path === '/billing/success') {
      trackEvent('Subscribe', {
        content_name: 'SageSet Premium',
        content_category: 'subscription',
        currency: 'USD',
        value: 9.99,
      });
      trackCustomEvent('TrialStarted', { source: 'stripe_success', value: 9.99, currency: 'USD' });
    }

    if (path === '/billing/cancel') {
      trackCustomEvent('CheckoutCancelled', { source: 'stripe_cancel' });
    }
  }, [path]);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{content.title}</h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">{content.body}</p>
        <a
          href="/"
          className="mt-8 inline-flex rounded-lg bg-sage-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sage-800"
        >
          Back to SageSet
        </a>
      </div>
    </section>
  );
}
