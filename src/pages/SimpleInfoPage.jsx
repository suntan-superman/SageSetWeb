import { useEffect } from 'react';
import { trackCustomEvent, trackEvent } from '../services/metaPixel';
import { faqEntries } from '../data/faqEntries.js';

const pageCopy = {
  '/testimonials': {
    title: 'Member stories',
    body: 'SageSet is early, but the product direction is clear: help users finish the workout, log the meal, and return tomorrow with less friction.',
  },
  '/before-after': {
    title: 'Before and after',
    body: 'Future transformation stories should emphasize consistency, completed workouts, nutrition habits, and realistic progress rather than exaggerated claims.',
  },
  '/supported-devices': {
    title: 'Supported devices',
    body: 'SageSet is built mobile-first for iPhone and Android. AR workout experiences remain feature-flagged while device support matures.',
  },
  '/billing/success': {
    title: 'Trial started',
    body: 'Your billing session is complete. Your card is saved, your free trial is active, and SageSet Premium begins billing at $9.99/month after the trial unless you cancel. Return to SageSet and refresh billing status if the update is not visible yet.',
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
      trackEvent('StartTrial', {
        content_name: 'SageSet Premium',
        content_category: 'subscription',
        trial_type: 'stripe_subscription',
      });
    }

    if (path === '/billing/cancel') {
      trackCustomEvent('CheckoutCancelled', { source: 'stripe_cancel' });
    }
  }, [path]);

  if (path === '/faq') {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Frequently asked questions</h1>
          <dl className="mt-8 space-y-8">
            {faqEntries.map(({ q, a }) => (
              <div key={q}>
                <dt className="text-lg font-semibold text-gray-900">{q}</dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{a}</dd>
              </div>
            ))}
          </dl>
          <a
            href="/"
            className="mt-10 inline-flex rounded-lg bg-sage-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sage-800"
          >
            Back to SageSet
          </a>
        </div>
      </section>
    );
  }

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
