import { useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChartBarIcon,
  CreditCardIcon,
  FireIcon,
  HeartIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, getDaysRemaining } from '../utils/date.js';
import { loadBillingStatus, openCustomerPortal, refreshEntitlements, startCheckout } from '../services/billing.js';

const dashboardNav = [
  { path: '/dashboard', label: 'Overview' },
  { path: '/dashboard/progress', label: 'Progress' },
  { path: '/dashboard/workouts', label: 'Workouts' },
  { path: '/dashboard/nutrition', label: 'Nutrition' },
  { path: '/dashboard/billing', label: 'Billing' },
  { path: '/dashboard/account', label: 'Account' },
];

const navClass = ({ isActive }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
    isActive ? 'bg-sage-100 text-sage-800' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  ].join(' ');

export default function DashboardPage({ section = 'overview' }) {
  const { user, userData, refreshUserData, logout } = useAuth();
  const location = useLocation();
  const [billing, setBilling] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const data = billing || userData || {};
  const trial = data.trial || userData?.trial || {};
  const subscription = data.subscription || userData?.subscription || {};
  const entitlements = data.entitlements || userData?.entitlements || {};
  const metrics = data.metrics || userData?.metrics || {};
  const daysRemaining = getDaysRemaining(trial.endsAt);
  const hasAccess = entitlements.premium === true || subscription.status === 'active' || trial.status === 'active';
  const checkoutResult = new URLSearchParams(location.search).get('checkout');

  const cards = useMemo(
    () => [
      { label: 'Trial days remaining', value: daysRemaining ?? '—', icon: FireIcon },
      { label: 'Workouts completed', value: metrics.workoutsCompleted || 0, icon: HeartIcon },
      { label: 'Meals logged', value: metrics.mealsLogged || 0, icon: ChartBarIcon },
      { label: 'Current streak', value: metrics.streakDays || 0, icon: FireIcon },
    ],
    [daysRemaining, metrics.mealsLogged, metrics.streakDays, metrics.workoutsCompleted]
  );

  const refresh = async () => {
    setBusy(true);
    setError('');
    try {
      const profile = await refreshUserData?.();
      let billingStatus = null;
      try {
        billingStatus = await loadBillingStatus();
      } catch (billingError) {
        console.warn('Billing status refresh failed:', billingError);
      }
      if (billingStatus) {
        setBilling(billingStatus);
      } else if (profile) {
        setBilling(profile);
      }
    } catch (err) {
      setError(err?.message || 'Unable to refresh dashboard.');
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshEntitlements = async () => {
    setBusy(true);
    setError('');
    try {
      await refreshEntitlements();
      await refresh();
    } catch (err) {
      console.warn('Entitlement refresh failed:', err);
      await refreshUserData?.();
      setError('Account data refreshed. Billing status will sync after the billing service is available.');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckout = async () => {
    setBusy(true);
    setError('');
    try {
      await startCheckout();
    } catch (err) {
      setError(err?.message || 'Unable to start checkout.');
      setBusy(false);
    }
  };

  const handlePortal = async () => {
    setBusy(true);
    setError('');
    try {
      await openCustomerPortal();
    } catch (err) {
      setError(err?.message || 'Unable to open customer portal.');
      setBusy(false);
    }
  };

  return (
    <section className="bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-content">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sage-700">Member dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {userData?.displayName || user?.displayName || user?.email || 'SageSet member'}
            </h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-sage-600 hover:text-sage-700"
          >
            Sign out
          </button>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {dashboardNav.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/dashboard'} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {checkoutResult === 'success' ? (
          <StatusBanner tone="success" text="Checkout complete. Subscription status may take a moment to sync." />
        ) : null}
        {checkoutResult === 'cancelled' ? (
          <StatusBanner tone="warning" text="Checkout was cancelled. No billing changes were made." />
        ) : null}
        {error ? <StatusBanner tone="error" text={error} /> : null}

        {section === 'billing' ? (
          <BillingPanel
            subscription={subscription}
            trial={trial}
            hasAccess={hasAccess}
            busy={busy}
            onCheckout={handleCheckout}
            onPortal={handlePortal}
            onRefresh={handleRefreshEntitlements}
          />
        ) : section === 'account' ? (
          <InfoPanel
            icon={UserCircleIcon}
            title="Account"
            body={`Signed in as ${user?.email || 'SageSet member'}. Account support, privacy, and data deletion tools remain available even if premium access is inactive.`}
          />
        ) : section === 'progress' ? (
          <InfoPanel icon={ChartBarIcon} title="Progress" body="Long-term progress analytics are connected to premium access. Your saved data remains tied to your account." />
        ) : section === 'workouts' ? (
          <InfoPanel icon={HeartIcon} title="Workouts" body="Workout plans and logging are available while your trial or subscription is active." />
        ) : section === 'nutrition' ? (
          <InfoPanel icon={ChartBarIcon} title="Nutrition" body="Nutrition analysis is available during trial and premium access, subject to abuse-prevention limits." />
        ) : (
          <Overview cards={cards} trial={trial} subscription={subscription} hasAccess={hasAccess} />
        )}
      </div>
    </section>
  );
}

function Overview({ cards, trial, subscription, hasAccess }) {
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{hasAccess ? 'Your access is active.' : 'Your trial has ended.'}</h2>
            <p className="mt-2 text-gray-600">
              Trial ends {formatDate(trial.endsAt)}. Subscription status: {subscription.status || 'none'}.
            </p>
          </div>
          <Link to="/dashboard/billing" className="rounded-lg bg-sage-700 px-5 py-3 text-center font-semibold text-white hover:bg-sage-800">
            Manage billing
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <card.icon className="h-6 w-6 text-sage-700" />
            <p className="mt-4 text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-1 text-sm font-medium text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingPanel({ subscription, trial, hasAccess, busy, onCheckout, onPortal, onRefresh }) {
  const active = subscription.status === 'active';
  const hasCustomer = typeof subscription.stripeCustomerId === 'string';

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <CreditCardIcon className="h-8 w-8 text-sage-700" />
      <h2 className="mt-4 text-2xl font-bold text-gray-900">SageSet Premium</h2>
      <p className="mt-2 text-gray-600">14-day free trial, then $9.99/month. Billing is securely managed by Stripe.</p>

      <dl className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Access" value={hasAccess ? 'Active' : 'Inactive'} />
        <Stat label="Subscription" value={subscription.status || 'none'} />
        <Stat label="Trial ends" value={formatDate(trial.endsAt || subscription.trialEnd)} />
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {active && hasCustomer ? (
          <button type="button" onClick={onPortal} disabled={busy} className="rounded-lg bg-sage-700 px-5 py-3 font-semibold text-white hover:bg-sage-800 disabled:opacity-60">
            Open Stripe customer portal
          </button>
        ) : (
          <button type="button" onClick={onCheckout} disabled={busy} className="rounded-lg bg-sage-700 px-5 py-3 font-semibold text-white hover:bg-sage-800 disabled:opacity-60">
            Activate SageSet Premium - $9.99/month
          </button>
        )}
        <button type="button" onClick={onRefresh} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:border-sage-600 hover:text-sage-700 disabled:opacity-60">
          <ArrowPathIcon className="h-5 w-5" />
          Refresh status
        </button>
      </div>
    </div>
  );
}

function InfoPanel({ icon: Icon, title, body }) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <Icon className="h-8 w-8 text-sage-700" />
      <h2 className="mt-4 text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-3xl text-gray-600">{body}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-gray-900">{value}</dd>
    </div>
  );
}

function StatusBanner({ tone, text }) {
  const classes = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    error: 'border-red-200 bg-red-50 text-red-800',
  };
  return <div className={`mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${classes[tone]}`}>{text}</div>;
}
