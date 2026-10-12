import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  BellAlertIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentListIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  UsersIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import AdminHeader from '../components/AdminHeader.jsx';
import GamificationRoadmapPanels from '../components/GamificationRoadmapPanels.jsx';
import {
  getUserAdminDetail,
  getAdminBillingDetail,
  getUserAdminPlanDetail,
  loadARSessionReviewBlob,
  getARChallengeRolloutForAdmin,
  getGamificationFoundationForAdmin,
  getGamificationPilotSpecForAdmin,
  getSocialChallengeDashboardForAdmin,
  listGamificationAnomalyReviewsForAdmin,
  getGamificationAnomalyReviewEvidenceForAdmin,
  getSprintCoachRolloutForAdmin,
  listUsersForAdmin,
  sendUserExpoNotification,
  manageStripeSubscriptionForAdmin,
  refundStripeChargeForAdmin,
  updateARChallengeRolloutForAdmin,
  updateGamificationFoundationForAdmin,
  createSageSetWeeklyChallengeForAdmin,
  verifyGamificationAnomalyReviewForAdmin,
  resolveGamificationAnomalyReviewForAdmin,
  updateSprintCoachRolloutForAdmin,
  updateSprintCoachUserAccessForAdmin,
  updateUserAccessForAdmin,
} from '../services/adminUsers.js';

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const formatCompactDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const formatFileSize = (bytes) => {
  const value = Number(bytes || 0);
  return value > 0 ? `${(value / (1024 * 1024)).toFixed(1)} MB` : 'Unknown size';
};

const formatPercent = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? `${Math.round(numeric * 10) / 10}%` : '0%';
};

const formatMoney = (amount, currency = 'usd') => {
  const value = Number(amount || 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: String(currency || 'usd').toUpperCase(),
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${String(currency || 'usd').toUpperCase()}`;
  }
};

const createBillingOperationId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `billing_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

const formatUserLabel = (user) =>
  user?.displayName?.trim() || user?.email?.trim() || user?.uid || 'Unknown user';

const formatPlanTitle = (plan) =>
  plan?.title?.trim() || plan?.name?.trim() || 'Untitled plan';

const formatExercisePrescription = (exercise) => {
  if (!exercise) return 'No prescription saved';

  if (exercise.durationSec) {
    return `${exercise.sets || 1} set${Number(exercise.sets || 1) === 1 ? '' : 's'} x ${exercise.durationSec}s`;
  }

  const sets = exercise.sets || 0;
  const reps = exercise.reps || 'custom reps';
  const rest = exercise.rest ? `, rest ${exercise.rest}` : '';
  return `${sets} set${Number(sets) === 1 ? '' : 's'} x ${reps}${rest}`;
};

const mergePlanDetail = (detail, loadedPlan) => {
  if (!detail || !loadedPlan?.id) return detail;
  const plans = (Array.isArray(detail.plans) ? detail.plans : []).map((plan) =>
    plan.id === loadedPlan.id ? loadedPlan : plan
  );
  const loadedPlans = plans.filter((plan) => plan.detailsLoaded === true);
  const loadedStats = loadedPlans.reduce(
    (acc, plan) => ({
      dayCount: acc.dayCount + Number(plan.stats?.dayCount || 0),
      workoutCount: acc.workoutCount + Number(plan.stats?.workoutCount || 0),
      exerciseCount: acc.exerciseCount + Number(plan.stats?.exerciseCount || 0),
    }),
    { dayCount: 0, workoutCount: 0, exerciseCount: 0 }
  );

  return {
    ...detail,
    plans,
    planDetailsLoaded: plans.length > 0 && loadedPlans.length === plans.length,
    stats: {
      ...(detail.stats || {}),
      ...loadedStats,
      loadedPlanCount: loadedPlans.length,
    },
  };
};

function StatCard({ icon: Icon, label, value, tone = 'emerald', help = '' }) {
  const toneClasses = {
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone] || toneClasses.emerald}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-white">{value}</div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
            <span>{label}</span>
            {help ? <HelpTooltip text={help} label={`About ${label}`} /> : null}
          </div>
        </div>
        <div className="rounded-xl bg-gray-900/60 p-3">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function HelpTooltip({ text, label = 'More information' }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`${label}: ${text}`}
        className="rounded-full text-gray-500 transition hover:text-emerald-300 focus:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-72 -translate-x-1/2 rounded-xl border border-gray-600 bg-gray-950 px-3 py-2 text-left text-xs font-normal leading-5 text-gray-200 shadow-2xl group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

function SectionHeading({ children, help }) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-semibold text-white">{children}</h3>
      {help ? <HelpTooltip text={help} label={`About ${children}`} /> : null}
    </div>
  );
}

function LoadingProgress({ label, detail, progress = 35 }) {
  const safeProgress = Math.max(8, Math.min(100, Number(progress) || 0));
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-gray-100">{label}</span>
        <span className="text-xs text-gray-400">{Math.round(safeProgress)}%</span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-gray-700"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(safeProgress)}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all duration-500"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
      {detail ? <p className="mt-3 text-xs leading-5 text-gray-400">{detail}</p> : null}
    </div>
  );
}

function AccessActionButton({
  action,
  label,
  help,
  onAction,
  loadingAction,
  tone = 'gray',
}) {
  const toneClasses = {
    gray: 'bg-gray-700 hover:bg-gray-600',
    blue: 'bg-blue-700 hover:bg-blue-600',
    emerald: 'bg-emerald-700 hover:bg-emerald-600',
    red: 'bg-red-800 hover:bg-red-700',
  };
  return (
    <div className="rounded-xl border border-gray-700/80 bg-gray-900/35 p-3">
      <div className="mb-3 flex min-h-10 items-start justify-between gap-2">
        <span className="text-sm font-medium leading-5 text-gray-100">{label}</span>
        <HelpTooltip text={help} label={`About ${label}`} />
      </div>
      <button
        type="button"
        onClick={() => onAction(action)}
        disabled={!!loadingAction}
        className={`w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses[tone] || toneClasses.gray}`}
      >
        {loadingAction === action ? 'Working…' : label}
      </button>
    </div>
  );
}

function DetailRow({ label, value, mono = false, help = '' }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-700/70 py-3 last:border-b-0">
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <span>{label}</span>
        {help ? <HelpTooltip text={help} label={`About ${label}`} /> : null}
      </div>
      <div className={`text-right text-sm text-white ${mono ? 'font-mono break-all' : ''}`}>
        {value || 'Not set'}
      </div>
    </div>
  );
}

function StatusChip({ children, tone = 'gray' }) {
  const toneClasses = {
    gray: 'bg-gray-700 text-gray-200',
    emerald: 'bg-emerald-500/15 text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-300',
    blue: 'bg-blue-500/15 text-blue-300',
    rose: 'bg-rose-500/15 text-rose-300',
    violet: 'bg-violet-500/15 text-violet-300',
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone] || toneClasses.gray}`}>
      {children}
    </span>
  );
}

function BillingManagementPanel({ uid, userEmail, onUserDataChanged }) {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workingAction, setWorkingAction] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [refundReason, setRefundReason] = useState('requested_by_customer');
  const [refundAmounts, setRefundAmounts] = useState({});

  const loadBilling = async () => {
    if (!uid) return;
    setLoading(true);
    setError('');
    try {
      setBilling(await getAdminBillingDetail(uid));
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load Stripe billing details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setBilling(null);
    setMessage('');
    setError('');
    setAdminNote('');
    setRefundAmounts({});
    void loadBilling();
  }, [uid]);

  const supportSuffix = (result) => {
    const notification = result?.supportNotification;
    if (notification?.status === 'sent') {
      return ` Support was notified at ${notification.recipient}.`;
    }
    return ` The support notification is queued for retry at ${notification?.recipient || 'support@worksidesoftware.com'}.`;
  };

  const changeSubscription = async (action) => {
    const confirmations = {
      schedule_cancel: 'Schedule cancellation at the end of the current Stripe billing period?',
      undo_cancel: 'Keep this Stripe subscription active and remove the scheduled cancellation?',
    };
    if (action === 'cancel_immediately') {
      const confirmation = window.prompt(
        'This immediately ends Stripe access and cannot be undone. Type CANCEL to continue.'
      );
      if (confirmation !== 'CANCEL') return;
    } else if (!window.confirm(confirmations[action])) {
      return;
    }

    setWorkingAction(action);
    setError('');
    setMessage('');
    try {
      const result = await manageStripeSubscriptionForAdmin({
        uid,
        action,
        note: adminNote,
        operationId: createBillingOperationId(),
      });
      setBilling(result?.billing || null);
      setMessage(
        `${action === 'schedule_cancel' ? 'Cancellation scheduled.' : action === 'undo_cancel' ? 'Scheduled cancellation removed.' : 'Subscription canceled immediately.'}${supportSuffix(result)}`
      );
      setAdminNote('');
      void onUserDataChanged?.();
    } catch (actionError) {
      setError(actionError?.message || 'Unable to update the Stripe subscription.');
    } finally {
      setWorkingAction('');
    }
  };

  const issueRefund = async (charge) => {
    const rawAmount = refundAmounts[charge.id];
    const dollars = rawAmount == null || rawAmount === ''
      ? Number(charge.refundableAmount || 0) / 100
      : Number(rawAmount);
    const amount = Math.round(dollars * 100);
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(charge.refundableAmount || 0)) {
      setError(`Enter a refund between ${formatMoney(1, charge.currency)} and ${formatMoney(charge.refundableAmount, charge.currency)}.`);
      return;
    }
    const confirmation = window.prompt(
      `Refund ${formatMoney(amount, charge.currency)} to ${userEmail || uid}? This cannot be undone. Type REFUND to continue.`
    );
    if (confirmation !== 'REFUND') return;

    setWorkingAction(`refund:${charge.id}`);
    setError('');
    setMessage('');
    try {
      const result = await refundStripeChargeForAdmin({
        uid,
        chargeId: charge.id,
        amount,
        reason: refundReason,
        note: adminNote,
        operationId: createBillingOperationId(),
      });
      setBilling(result?.billing || null);
      setMessage(`Refund ${result?.refund?.status || 'submitted'} for ${formatMoney(result?.refund?.amount, result?.refund?.currency)}.${supportSuffix(result)}`);
      setAdminNote('');
      setRefundAmounts((current) => {
        const next = { ...current };
        delete next[charge.id];
        return next;
      });
      void onUserDataChanged?.();
    } catch (refundError) {
      setError(refundError?.message || 'Unable to issue the Stripe refund.');
    } finally {
      setWorkingAction('');
    }
  };

  const subscription = billing?.subscription;
  const stripeManaged = billing?.stripeManaged === true;
  const canceled = subscription?.status === 'canceled' || subscription?.status === 'cancelled';

  return (
    <section className="rounded-2xl border border-cyan-500/25 bg-gray-800/90 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionHeading help="Live provider-backed billing controls. These actions call Stripe from an admin-only Cloud Function and are recorded in the admin audit log.">
            Subscription & Refund Management
          </SectionHeading>
          <p className="mt-2 text-sm text-gray-400">
            Changes send an audit email to support@worksidesoftware.com after the provider confirms them.
          </p>
        </div>
        <button
          type="button"
          onClick={loadBilling}
          disabled={loading || Boolean(workingAction)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700 disabled:opacity-50"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh billing
        </button>
      </div>

      {loading ? (
        <div className="mt-5"><LoadingProgress label="Loading provider billing" detail="Retrieving the live subscription and recent Stripe charges." progress={68} /></div>
      ) : error && !billing ? (
        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusChip tone={stripeManaged ? 'emerald' : 'amber'}>{billing?.provider || 'No provider'}</StatusChip>
            <StatusChip tone={subscription?.status === 'active' || subscription?.status === 'trialing' ? 'emerald' : canceled ? 'rose' : 'amber'}>
              {subscription?.status || billing?.storedStatus || 'No subscription'}
            </StatusChip>
            {subscription?.cancelAtPeriodEnd ? <StatusChip tone="rose">Cancels at period end</StatusChip> : null}
          </div>

          {!stripeManaged ? (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
              <p>{billing?.managementMessage}</p>
              {billing?.provider === 'apple' ? (
                <a className="mt-3 inline-block font-semibold underline" href="https://appstoreconnect.apple.com/" target="_blank" rel="noreferrer">
                  Open App Store Connect
                </a>
              ) : billing?.provider === 'google_play' ? (
                <a className="mt-3 inline-block font-semibold underline" href="https://play.google.com/console/" target="_blank" rel="noreferrer">
                  Open Google Play Console
                </a>
              ) : null}
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4"><div className="text-xs uppercase tracking-wide text-gray-500">Subscription</div><div className="mt-2 break-all font-mono text-sm text-white">{subscription?.id || 'Not found'}</div></div>
                <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4"><div className="text-xs uppercase tracking-wide text-gray-500">Renews / ends</div><div className="mt-2 text-sm text-white">{formatDateTime(subscription?.currentPeriodEnd)}</div></div>
                <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4"><div className="text-xs uppercase tracking-wide text-gray-500">Price</div><div className="mt-2 text-sm text-white">{subscription?.price?.amount == null ? 'Not available' : `${formatMoney(subscription.price.amount, subscription.price.currency)} / ${subscription.price.interval || 'period'}`}</div></div>
                <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4"><div className="text-xs uppercase tracking-wide text-gray-500">Customer</div><div className="mt-2 break-all font-mono text-sm text-white">{billing?.customerId}</div></div>
              </div>

              {subscription?.dashboardUrl ? <a className="mt-3 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200" href={subscription.dashboardUrl} target="_blank" rel="noreferrer">Open subscription in Stripe ↗</a> : null}

              <label className="mt-5 block">
                <span className="text-sm font-medium text-gray-300">Internal reason / note</span>
                <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} rows={2} maxLength={500} placeholder="Optional context for the audit log and support email" className="mt-2 w-full rounded-xl border border-gray-600 bg-gray-950/50 px-4 py-3 text-sm text-white placeholder-gray-500" />
              </label>

              {subscription ? (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <button type="button" disabled={Boolean(workingAction) || canceled || subscription.cancelAtPeriodEnd} onClick={() => changeSubscription('schedule_cancel')} className="rounded-xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">{workingAction === 'schedule_cancel' ? 'Scheduling…' : 'Cancel at period end'}</button>
                  <button type="button" disabled={Boolean(workingAction) || canceled || !subscription.cancelAtPeriodEnd} onClick={() => changeSubscription('undo_cancel')} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">{workingAction === 'undo_cancel' ? 'Updating…' : 'Keep subscription active'}</button>
                  <button type="button" disabled={Boolean(workingAction) || canceled} onClick={() => changeSubscription('cancel_immediately')} className="rounded-xl bg-red-800 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">{workingAction === 'cancel_immediately' ? 'Canceling…' : 'Cancel immediately'}</button>
                </div>
              ) : null}

              <div className="mt-7 border-t border-gray-700 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white">Recent Stripe payments</h4>
                    <p className="mt-1 text-xs text-gray-500">Refunds do not automatically cancel the subscription.</p>
                  </div>
                  <select value={refundReason} onChange={(event) => setRefundReason(event.target.value)} className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white">
                    <option value="requested_by_customer">Requested by customer</option>
                    <option value="duplicate">Duplicate charge</option>
                    <option value="fraudulent">Fraudulent</option>
                  </select>
                </div>
                <div className="mt-4 space-y-3">
                  {(billing?.charges || []).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-700 p-5 text-center text-sm text-gray-400">No Stripe charges found.</div>
                  ) : billing.charges.map((charge) => (
                    <div key={charge.id} className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-white">{formatMoney(charge.amount, charge.currency)} · {charge.paymentMethod || 'Payment method unavailable'}</div>
                          <div className="mt-1 text-xs text-gray-400">{formatDateTime(charge.createdAt)} · {charge.id}</div>
                          {charge.amountRefunded > 0 ? <div className="mt-1 text-xs text-amber-300">Refunded {formatMoney(charge.amountRefunded, charge.currency)} · {formatMoney(charge.refundableAmount, charge.currency)} remaining</div> : null}
                          <div className="mt-2 flex gap-3 text-xs"><a className="text-cyan-300 hover:underline" href={charge.dashboardUrl} target="_blank" rel="noreferrer">Stripe payment ↗</a>{charge.receiptUrl ? <a className="text-cyan-300 hover:underline" href={charge.receiptUrl} target="_blank" rel="noreferrer">Receipt ↗</a> : null}</div>
                        </div>
                        <div className="flex min-w-[250px] flex-wrap items-end gap-2">
                          <label className="flex-1"><span className="block text-xs text-gray-500">Refund amount</span><input type="number" min="0.01" step="0.01" max={(Number(charge.refundableAmount || 0) / 100).toFixed(2)} value={refundAmounts[charge.id] ?? (Number(charge.refundableAmount || 0) / 100).toFixed(2)} onChange={(event) => setRefundAmounts((current) => ({...current, [charge.id]: event.target.value}))} disabled={charge.refundableAmount <= 0 || Boolean(workingAction)} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white disabled:text-gray-500" /></label>
                          <button type="button" onClick={() => issueRefund(charge)} disabled={charge.refundableAmount <= 0 || Boolean(workingAction) || !charge.paid} className="rounded-lg bg-red-800 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">{workingAction === `refund:${charge.id}` ? 'Refunding…' : charge.refundableAmount <= 0 ? 'Fully refunded' : 'Issue refund'}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {message ? <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}
          {error ? <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
        </>
      )}
    </section>
  );
}

function ARChallengeRolloutPanel() {
  const [rollout, setRollout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const loadRollout = async () => {
    setLoading(true);
    setError('');
    try {
      setRollout(await getARChallengeRolloutForAdmin());
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load the AR rollout policy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRollout();
  }, []);

  const updateRollout = async (enabled) => {
    const verb = enabled ? 'enable' : 'disable';
    if (!window.confirm(`Are you sure you want to ${verb} AR challenges globally?`)) return;

    setUpdating(true);
    setError('');
    try {
      setRollout(await updateARChallengeRolloutForAdmin({ enabled }));
    } catch (updateError) {
      setError(updateError?.message || 'Unable to update the AR rollout policy.');
    } finally {
      setUpdating(false);
    }
  };

  const updatePublicFeature = async (feature, enabled) => {
    const labels = {
      squat: 'AR squats',
      pushup: 'AR push-ups',
      smartReturn: 'Smart Return check-in',
    };
    const verb = enabled ? 'publish' : 'hide';
    if (!window.confirm(`Are you sure you want to ${verb} ${labels[feature]} for all users?`)) return;

    setUpdating(true);
    setError('');
    try {
      setRollout(
        await updateARChallengeRolloutForAdmin({
          publicFeatures: { [feature]: enabled },
        })
      );
    } catch (updateError) {
      setError(updateError?.message || 'Unable to update public feature availability.');
    } finally {
      setUpdating(false);
    }
  };

  const isEnabled = rollout?.enabled === true;
  const publicFeatures = rollout?.publicFeatures || {};

  return (
    <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Feature Rollout</h2>
            <HelpTooltip
              label="About feature rollout"
              text="Public switches expose a capability to all eligible members. Per-user feature access farther down exposes an unpublished capability only to the selected account."
            />
            <StatusChip tone={isEnabled ? 'amber' : 'emerald'}>
              {loading ? 'Checking policy' : isEnabled ? 'Controlled rollout enabled' : 'Globally disabled'}
            </StatusChip>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-gray-300">
            The AR master switch gates squat and push-up camera experiences. Public switches and per-user feature access are
            evaluated whenever the app opens or returns to the foreground, without requiring a separate EAS binary.
            Smart Return check-in access is independent of both the AR master switch and the standard Take a Break action.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Recommended launch state: AR enabled, squats public, push-ups hidden, Smart Return check-in hidden.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusChip tone={publicFeatures.squat ? 'emerald' : 'gray'}>
              Squats {publicFeatures.squat ? 'public' : 'tester-only'}
            </StatusChip>
            <StatusChip tone={publicFeatures.pushup ? 'emerald' : 'gray'}>
              Push-ups {publicFeatures.pushup ? 'public' : 'tester-only'}
            </StatusChip>
            <StatusChip tone={publicFeatures.smartReturn ? 'emerald' : 'gray'}>
              Smart Return check-in {publicFeatures.smartReturn ? 'public' : 'tester-only'}
            </StatusChip>
          </div>
          {rollout?.updatedAt ? <p className="mt-2 text-xs text-gray-500">Last changed {formatDateTime(rollout.updatedAt)}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadRollout}
            disabled={loading || updating}
            className="rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => updateRollout(!isEnabled)}
            disabled={loading || updating}
            className={`rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isEnabled ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-700 hover:bg-emerald-600'
            }`}
          >
            {updating ? 'Updating...' : isEnabled ? 'Disable AR globally' : 'Enable controlled rollout'}
          </button>
        </div>
        <div className="mt-4 grid w-full gap-3 border-t border-amber-500/20 pt-4 md:grid-cols-3">
          {[
            ['squat', 'AR squats', 'Controls whether every member can access the camera-tracked squat challenge. Tester access remains available while this is unpublished.'],
            ['pushup', 'AR push-ups', 'Controls whether every member can access camera-tracked push-ups. Keep unpublished while push-up testing is still in progress.'],
            ['smartReturn', 'Smart Return check-in', 'Controls the enhanced return check-in and recommendations after a break. It does not hide Take a Break, which remains available independently.'],
          ].map(([feature, label, help]) => {
            const published = publicFeatures[feature] === true;
            return (
              <div key={feature} className="rounded-xl border border-gray-700/80 bg-gray-900/30 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-100">{label}</span>
                  <HelpTooltip text={help} label={`About ${label}`} />
                </div>
                <button
                  type="button"
                  onClick={() => updatePublicFeature(feature, !published)}
                  disabled={loading || updating}
                  className={`w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    published ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-700 hover:bg-blue-600'
                  }`}
                >
                  {published ? `Hide ${label}` : `Publish ${label}`}
                </button>
                <a
                  href={`/admin/releases?feature=${feature}`}
                  className="mt-2 block text-center text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  Create release announcement
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GamificationFoundationPanel() {
  const [foundation, setFoundation] = useState(null);
  const [pilotSpec, setPilotSpec] = useState(null);
  const [rolloutPercentDraft, setRolloutPercentDraft] = useState('0');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const loadFoundation = async () => {
    setLoading(true);
    setError('');
    try {
      const [result, spec] = await Promise.all([
        getGamificationFoundationForAdmin(),
        getGamificationPilotSpecForAdmin(),
      ]);
      setFoundation(result);
      setPilotSpec(spec);
      setRolloutPercentDraft(String(result?.policy?.rolloutPercent ?? 0));
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load the gamification foundation policy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoundation();
  }, []);

  const policy = foundation?.policy || {};
  const pilotMetrics = foundation?.verifiedChallengePilotMetrics || null;
  const sharingMetrics = foundation?.sharingPilotMetrics || null;
  const pilotReviewCount = (pilotMetrics?.underReviewCount || 0) + (pilotMetrics?.disputedCount || 0);
  const updatePolicy = async (field, value) => {
    setUpdating(true);
    setError('');
    try {
      setFoundation(await updateGamificationFoundationForAdmin({ [field]: value }));
    } catch (updateError) {
      setError(updateError?.message || 'Unable to update the gamification foundation policy.');
    } finally {
      setUpdating(false);
    }
  };

  const controls = [
    ['globallyEnabled', 'Master pilot switch', 'Master kill switch for all gamification access. Enable it for an internal pilot; disabling it immediately fails closed for every user without changing individual enrollment.'],
    ['conceptsEnabled', 'Validation concepts', 'Enables server access for enrolled internal testers. The mobile build gate is still required.'],
    ['scoreEnabled', 'SageScore', 'Calculates a private candidate SageScore and immutable history for eligible internal testers.'],
    ['xpEnabled', 'XP', 'Awards replay-safe, non-decreasing pilot XP to eligible internal testers.'],
    ['achievementsEnabled', 'Achievements', 'Unlocks replay-safe pilot achievements for eligible internal testers.'],
    ['challengesEnabled', 'Verified challenges', 'Enables the server-validated weekly squat challenge for enrolled testers who also have AR squat access. Attempt limits, rest guidance, and server verification remain enforced.'],
    ['sharingEnabled', 'Verified sharing', 'Allows enrolled testers to create an opaque public link for a verified squat result. Links reveal only the verified rep count, expire after 90 days, and fail closed when this switch is disabled.'],
    ['publicEnabled', 'Public rollout', 'Allows the configured rollout percentage to become eligible. Keep off for tester-only validation.'],
    ['allowTesterAccess', 'Tester rollout', 'Allows users with the per-account gamification tester flag to become eligible.'],
  ];

  const saveRolloutPercent = async () => {
    const value = Number(rolloutPercentDraft);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setError('Rollout percentage must be between 0 and 100.');
      return;
    }
    await updatePolicy('rolloutPercent', Math.floor(value));
  };

  return (
    <section className="mt-8 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Gamification Foundation</h2>
            <HelpTooltip
              label="About the gamification foundation"
               text="These controls are server-owned guardrails for internal SageScore, XP, rank, achievement, and verified-challenge pilots. Score, XP, and achievement switches create private pilot state only for eligible users whose build also contains the concept gate."
            />
            <StatusChip tone={policy.globallyEnabled ? 'amber' : 'emerald'}>
              {loading ? 'Checking policy' : policy.globallyEnabled ? 'Pilot policy enabled' : 'Fail-closed'}
            </StatusChip>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-gray-300">
             Candidate version <span className="font-mono text-violet-200">{foundation?.version || 'candidate-v0'}</span>. For a tester-only pilot, keep Public rollout off and rollout percentage at 0, enable Tester rollout, and enroll accounts individually. Build-time gates remain authoritative.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusChip tone={policy.globallyEnabled ? 'amber' : 'emerald'}>Master pilot {policy.globallyEnabled ? 'on' : 'off'}</StatusChip>
            <StatusChip tone={policy.scoreEnabled ? 'amber' : 'gray'}>SageScore {policy.scoreEnabled ? 'pilot on' : 'off'}</StatusChip>
             <StatusChip tone={policy.xpEnabled ? 'amber' : 'gray'}>XP {policy.xpEnabled ? 'pilot on' : 'off'}</StatusChip>
             <StatusChip tone={policy.achievementsEnabled ? 'amber' : 'gray'}>Achievements {policy.achievementsEnabled ? 'pilot on' : 'off'}</StatusChip>
            <StatusChip tone={policy.challengesEnabled ? 'amber' : 'gray'}>Verified challenge {policy.challengesEnabled ? 'pilot on' : 'off'}</StatusChip>
            <StatusChip tone={policy.sharingEnabled ? 'amber' : 'gray'}>Verified sharing {policy.sharingEnabled ? 'pilot on' : 'off'}</StatusChip>
          </div>
          {pilotSpec ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusChip tone="blue">XP {pilotSpec.xpPolicy?.version || 'legacy'}</StatusChip>
              <StatusChip tone="blue">Quests {pilotSpec.weeklyQuestPolicy?.version || 'legacy'}</StatusChip>
              <StatusChip tone="blue">Consistency {pilotSpec.consistencyStreakPolicy?.version || 'legacy'}</StatusChip>
              <StatusChip tone="gray">{pilotSpec.achievementDefinitions?.length || 0} achievement definitions</StatusChip>
            </div>
          ) : null}
          {!loading && !policy.globallyEnabled && (
            policy.conceptsEnabled ||
            policy.scoreEnabled ||
            policy.xpEnabled ||
            policy.achievementsEnabled ||
            policy.sharingEnabled ||
            policy.allowTesterAccess
          ) ? (
            <div className="mt-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              The component switches are configured, but all gamification access is still blocked because the Master pilot switch is off. Enable it only when you are ready for enrolled testers to receive access.
            </div>
          ) : null}
          {policy.updatedAt ? <p className="mt-2 text-xs text-gray-500">Last changed {formatDateTime(policy.updatedAt)}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={loadFoundation}
          disabled={loading || updating}
          className="rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
        <div className="mt-4 w-full rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Verified challenge pilot metrics</h3>
                <HelpTooltip
                  label="About verified challenge pilot metrics"
                  text="Bounded server summary of up to 500 submitted verified-challenge results. Use these rates to evaluate recognition and review thresholds before expanding the pilot. These metrics do not change XP or SageScore."
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Recognition outcomes only. A small sample is directional and is not sufficient for public rollout.
              </p>
            </div>
            {pilotMetrics?.lastObservedAt ? (
              <span className="text-xs text-gray-500">Latest {formatDateTime(pilotMetrics.lastObservedAt)}</span>
            ) : null}
          </div>
          {pilotMetrics?.available === false ? (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              {pilotMetrics.error || 'Verified challenge pilot metrics are temporarily unavailable.'}
            </div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {[
                ['Results', pilotMetrics?.totalResults ?? 0, `${pilotMetrics?.uniqueTesterCount ?? 0} tester(s)`],
                ['Verified', pilotMetrics?.verifiedCount ?? 0, `${pilotMetrics?.verificationRate ?? 0}%`],
                ['Not verified', pilotMetrics?.notVerifiedCount ?? 0, `${pilotMetrics?.notVerifiedRate ?? 0}%`],
                ['Review / disputed', pilotReviewCount, `${pilotMetrics?.reviewRate ?? 0}%`],
                ['Avg confidence', pilotMetrics?.averageConfidence ?? '—', pilotMetrics?.averageConfidence == null ? 'No results' : 'percent'],
                ['XP credits', pilotMetrics?.creditAwardedCount ?? 0, `${pilotMetrics?.completedCount ?? 0} completed`],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-lg border border-gray-700 bg-gray-950/35 px-3 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
                  <div className="mt-1 text-xl font-semibold text-white">{value}</div>
                  <div className="mt-1 text-xs text-gray-400">{detail}</div>
                </div>
              ))}
            </div>
          )}
          {pilotMetrics?.sampleCapped ? (
            <p className="mt-3 text-xs text-amber-200">The 500-result pilot window is full; use an exported analysis before changing thresholds.</p>
          ) : null}
        </div>
        <div className="mt-4 w-full rounded-xl border border-sky-500/25 bg-sky-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Verified sharing pilot metrics</h3>
                <HelpTooltip
                  label="About verified sharing metrics"
                  text="Counts privacy-safe invitation records created by eligible testers. Opening and completed share actions are measured separately in Workside Analytics."
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">No member name, recording, email, or workout history appears in a public share.</p>
            </div>
            <StatusChip tone={policy.sharingEnabled ? 'amber' : 'gray'}>{policy.sharingEnabled ? 'Tester sharing enabled' : 'Sharing disabled'}</StatusChip>
          </div>
          {sharingMetrics?.available === false ? (
            <p className="mt-3 text-sm text-amber-200">{sharingMetrics.error || 'Sharing metrics are temporarily unavailable.'}</p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Created', sharingMetrics?.totalShares ?? 0],
                ['Active', sharingMetrics?.activeShares ?? 0],
                ['Revoked', sharingMetrics?.revokedShares ?? 0],
                ['Unique sharers', sharingMetrics?.uniqueSharers ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-gray-700 bg-gray-950/35 px-3 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
                  <div className="mt-1 text-xl font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 grid w-full gap-3 border-t border-violet-500/20 pt-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-700/80 bg-gray-900/30 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-100">Rollout percentage</span>
              <HelpTooltip text="Deterministically includes a percentage of users when Public rollout is enabled. Keep at 0 for tester-only validation." label="About rollout percentage" />
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={rolloutPercentDraft}
                onChange={(event) => setRolloutPercentDraft(event.target.value)}
                disabled={loading || updating}
                className="w-full rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white"
                aria-label="Gamification rollout percentage"
              />
              <button
                type="button"
                onClick={saveRolloutPercent}
                disabled={loading || updating}
                className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
          {controls.map(([field, label, help]) => {
            const enabled = policy[field] === true;
            return (
              <div key={field} className="rounded-xl border border-gray-700/80 bg-gray-900/30 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-100">{label}</span>
                  <HelpTooltip text={help} label={`About ${label}`} />
                </div>
                <button
                  type="button"
                  onClick={() => updatePolicy(field, !enabled)}
                  disabled={loading || updating}
                  className={`w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${enabled ? 'bg-red-700 hover:bg-red-600' : 'bg-violet-700 hover:bg-violet-600'}`}
                >
                  {enabled ? `Disable ${label}` : `Enable ${label}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SageSetWeeklyChallengePanel() {
  const [challenges, setChallenges] = useState([]);
  const [title, setTitle] = useState('SageSet Weekly Squat Goal');
  const [exerciseType, setExerciseType] = useState('SQUATS');
  const [targetReps, setTargetReps] = useState('25');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const loadChallenges = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getSocialChallengeDashboardForAdmin();
      setChallenges((result?.challenges || []).filter((challenge) => challenge.scope === 'SAGESET'));
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load SageSet weekly challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const publish = async () => {
    const reps = Math.floor(Number(targetReps));
    if (title.trim().length < 3 || !Number.isFinite(reps) || reps < 5 || reps > 100) {
      setError('Enter a title and a verified squat target between 5 and 100.');
      return;
    }
    setPublishing(true);
    setError('');
    try {
      await createSageSetWeeklyChallengeForAdmin({
        title: title.trim(),
        exerciseType,
        targetReps: reps,
      });
      await loadChallenges();
    } catch (publishError) {
      setError(publishError?.message || 'Unable to publish the weekly challenge.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">SageSet Weekly Competition</h2>
            <HelpTooltip
              label="About SageSet weekly competition"
              text="Publishes a weekly rep goal that every member can join. Public leaderboards use only SageSet names; email addresses and phone numbers are never shown."
            />
            <StatusChip tone="emerald">{challenges.length} active</StatusChip>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-gray-300">
            Set the all-member goal here. The mobile app shows progress for the current Monday-to-Sunday UTC challenge window.
          </p>
        </div>
        <button type="button" onClick={loadChallenges} disabled={loading || publishing} className="rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700 disabled:opacity-60">
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_140px_auto]">
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} aria-label="Weekly challenge title" className="rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white" />
        <select value={exerciseType} onChange={(event) => setExerciseType(event.target.value)} aria-label="Weekly challenge exercise" className="rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white">
          <option value="SQUATS">Squats</option>
          <option value="PUSHUPS" disabled>Push-ups — verification unavailable</option>
        </select>
        <input value={targetReps} onChange={(event) => setTargetReps(event.target.value)} type="number" min="5" max="100" aria-label="Weekly challenge rep target" className="rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white" />
        <button type="button" onClick={publish} disabled={publishing || loading} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60">
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {loading ? <p className="text-sm text-gray-400">Loading weekly challenges…</p> : challenges.length === 0 ? (
          <p className="text-sm text-gray-400">No all-member competition is active for this week.</p>
        ) : challenges.map((challenge) => (
          <div key={challenge.id} className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold text-white">{challenge.title}</p><p className="mt-1 text-xs text-gray-400">{challenge.targetReps} {challenge.exerciseType === 'PUSHUPS' ? 'push-ups' : 'squats'} · ends {formatDateTime(challenge.endsAt)}</p></div>
              <StatusChip tone="emerald">{challenge.participants?.length || 0} joined</StatusChip>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GamificationIntegrityPanel() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState('');
  const [evidenceLoadingId, setEvidenceLoadingId] = useState('');
  const [recordingOpeningId, setRecordingOpeningId] = useState('');
  const [evidenceByReview, setEvidenceByReview] = useState({});
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState('');

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listGamificationAnomalyReviewsForAdmin(50);
      setReviews(Array.isArray(result?.reviews) ? result.reviews : []);
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load gamification integrity reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const updateDraft = (reviewId, patch) => {
    setDrafts((current) => ({
      ...current,
      [reviewId]: { ...(current[reviewId] || {}), ...patch },
    }));
  };

  const loadEvidence = async (review) => {
    if (!review?.id || evidenceLoadingId) return;
    if (evidenceByReview[review.id]) {
      setEvidenceByReview((current) => ({ ...current, [review.id]: null }));
      return;
    }
    setEvidenceLoadingId(review.id);
    setError('');
    try {
      const evidence = await getGamificationAnomalyReviewEvidenceForAdmin(review.id);
      setEvidenceByReview((current) => ({ ...current, [review.id]: evidence }));
      const firstRecording = evidence?.recordingCandidates?.[0];
      updateDraft(review.id, {
        recordingId: firstRecording?.id || '',
        verifiedReps: Number(evidence?.thresholds?.targetReps || 20),
        note: drafts[review.id]?.note || '',
      });
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load the linked challenge evidence.');
    } finally {
      setEvidenceLoadingId('');
    }
  };

  const openRecording = async (recording) => {
    if (!recording?.storagePath || recordingOpeningId) return;
    const previewWindow = window.open('', '_blank', 'noopener,noreferrer');
    setRecordingOpeningId(recording.id);
    setError('');
    try {
      const blob = await loadARSessionReviewBlob(recording.storagePath);
      const objectUrl = URL.createObjectURL(blob);
      if (previewWindow) previewWindow.location.href = objectUrl;
      else window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10 * 60 * 1000);
    } catch (openError) {
      previewWindow?.close();
      setError(openError?.message || 'The challenge recording could not be opened. It may have expired.');
    } finally {
      setRecordingOpeningId('');
    }
  };

  const manuallyVerify = async (review) => {
    const draft = drafts[review.id] || {};
    if (!draft.recordingId || String(draft.note || '').trim().length < 10) {
      setError('Select and watch a recording, then add a review note of at least 10 characters.');
      return;
    }
    const verifiedReps = Math.floor(Number(draft.verifiedReps));
    if (!window.confirm(
      `Verify ${verifiedReps} squat reps after manual video review? This is audited and may grant the one-time weekly challenge credit. The video will still be deleted at its displayed expiration time.`
    )) return;
    setWorkingId(review.id);
    setError('');
    try {
      const result = await verifyGamificationAnomalyReviewForAdmin({
        reviewId: review.id,
        recordingId: draft.recordingId,
        verifiedReps,
        note: String(draft.note).trim(),
      });
      setReviews((current) => current.map((item) => item.id === review.id
        ? { ...item, status: 'resolved', reviewDecision: 'manual_video_verified', resolutionNote: String(draft.note).trim() }
        : item));
      setEvidenceByReview((current) => ({
        ...current,
        [review.id]: current[review.id] ? {
          ...current[review.id],
          manualVerificationAvailable: false,
          result: {
            ...current[review.id].result,
            status: 'verified',
            verificationMethod: 'manual_video_review',
            reps: verifiedReps,
            creditEligible: result?.creditEligible === true,
          },
        } : null,
      }));
    } catch (verifyError) {
      setError(verifyError?.message || 'Unable to verify this result after manual review.');
    } finally {
      setWorkingId('');
    }
  };

  const resolveReview = async (review, status) => {
    if (!review?.id || workingId) return;
    const action = status === 'resolved' ? 'uphold the original non-verified result' : 'close this review as inconclusive without credit';
    if (!window.confirm(`Are you sure you want to ${action}? This action cannot award XP or mark the attempt verified.`)) return;
    setWorkingId(review.id);
    setError('');
    try {
      await resolveGamificationAnomalyReviewForAdmin({
        reviewId: review.id,
        status,
        note: `Reviewed in SageSet admin on ${new Date().toISOString()}`,
      });
      setReviews((current) => current.map((item) => item.id === review.id ? { ...item, status } : item));
    } catch (resolveError) {
      setError(resolveError?.message || 'Unable to update the integrity review.');
    } finally {
      setWorkingId('');
    }
  };

  const openCount = reviews.filter((review) => review.status === 'open').length;

  return (
    <section className="mt-8 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Gamification Integrity Reviews</h2>
            <HelpTooltip
              label="About integrity reviews"
              text="Inspect automated diagnostics and an unexpired tester recording. An administrator may uphold the automated result, close the review as inconclusive, or verify observed reps after video review. Every decision is audited."
            />
            <StatusChip tone={openCount > 0 ? 'rose' : 'emerald'}>{openCount} open</StatusChip>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-gray-300">
            Review disputed verified-challenge results against diagnostics and tester video. Manual verification requires an eligible recording and observed rep count; videos are automatically deleted after 14 days even when a review remains open.
          </p>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={loadReviews}
          disabled={loading || !!workingId}
          className="rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-4"><LoadingProgress label="Loading integrity reviews" detail="Checking the server-owned review queue." progress={62} /></div>
      ) : reviews.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-700 px-4 py-6 text-center text-sm text-gray-400">
          No integrity reviews have been created. This is expected while verified challenges remain gated.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((review) => {
            const evidence = evidenceByReview[review.id];
            const draft = drafts[review.id] || {};
            const session = evidence?.session;
            const tracking = session?.tracking || {};
            const thresholds = evidence?.thresholds || {};
            const recordings = Array.isArray(evidence?.recordingCandidates) ? evidence.recordingCandidates : [];
            return (
            <div key={review.id} className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{review.category || 'Uncategorized'}</span>
                    <StatusChip tone={review.severity === 'critical' || review.severity === 'high' ? 'rose' : review.severity === 'medium' ? 'amber' : 'gray'}>{review.severity || 'unknown'}</StatusChip>
                    <StatusChip tone={review.status === 'open' ? 'rose' : 'emerald'}>{review.status || 'unknown'}</StatusChip>
                  </div>
                  <p className="mt-2 text-sm text-gray-200">{review.summary || 'No summary provided.'}</p>
                  <p className="mt-2 text-xs text-gray-500">User {review.userId || 'unknown'} · {review.source || 'unknown source'} · {formatDateTime(review.createdAt)}</p>
                  {review.evidence && typeof review.evidence === 'object' ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                      {review.evidence.challengeId ? <StatusChip tone="gray">Challenge {review.evidence.challengeId}</StatusChip> : null}
                      {review.evidence.resultId ? <StatusChip tone="gray">Result {review.evidence.resultId}</StatusChip> : null}
                      {review.evidence.attemptId ? <StatusChip tone="gray">Attempt {review.evidence.attemptId}</StatusChip> : null}
                      {review.evidence.sessionId ? <StatusChip tone="gray">Session {review.evidence.sessionId}</StatusChip> : null}
                    </div>
                  ) : null}
                  {review.resolutionNote ? <p className="mt-2 text-xs text-emerald-200">Resolution: {review.resolutionNote}</p> : null}
                </div>
                {review.status === 'open' ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {review.source === 'verified_weekly_challenge' ? (
                      <button type="button" disabled={!!workingId || !!evidenceLoadingId} onClick={() => loadEvidence(review)} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
                        {evidenceLoadingId === review.id ? 'Loading evidence…' : evidence ? 'Hide evidence' : 'Inspect evidence'}
                      </button>
                    ) : null}
                    <button type="button" disabled={!!workingId} onClick={() => resolveReview(review, 'resolved')} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60">{workingId === review.id ? 'Working…' : 'Uphold not verified'}</button>
                    <button type="button" disabled={!!workingId} onClick={() => resolveReview(review, 'dismissed')} className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-600 disabled:opacity-60">Close as inconclusive</button>
                  </div>
                ) : null}
              </div>

              {evidence ? (
                <div className="mt-4 space-y-4 border-t border-gray-700 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ['Automated result', `${Number(evidence.result?.reps || 0)} reps · ${Number(evidence.result?.confidence || 0)}% confidence`],
                      ['Eligible frames', `${formatPercent(tracking.eligibleFramePercent)} · minimum ${formatPercent(thresholds.minimumEligibleFramePercent)}`],
                      ['Low-confidence frames', `${formatPercent(tracking.lowConfidenceFramePercent)} · maximum ${formatPercent(thresholds.maximumLowConfidenceFramePercent)}`],
                      ['Tracking signals', `${Number(tracking.trackingLossCount || 0)} losses · ${Number(tracking.countingConcernCount || 0)} concerns`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-gray-700 bg-gray-950/40 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
                        <div className="mt-1 text-sm font-medium text-gray-100">{value}</div>
                      </div>
                    ))}
                  </div>
                  {Array.isArray(evidence.result?.reasons) && evidence.result.reasons.length ? (
                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-sm text-amber-100">
                      <span className="font-semibold">Automated failure reasons:</span> {evidence.result.reasons.join(' ')}
                    </div>
                  ) : null}

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white">Matching tester recordings</h3>
                      <span className="text-xs text-gray-400">Video only · no microphone · {evidence.recordingRetentionDays || 14}-day retention</span>
                    </div>
                    {recordings.length === 0 ? (
                      <div className="mt-2 rounded-lg border border-dashed border-gray-700 p-4 text-sm text-amber-200">
                        {evidence.recordingUnavailableReason || 'No unexpired matching recording is available. Manual verification is disabled.'}
                      </div>
                    ) : (
                      <div className="mt-2 grid gap-2 lg:grid-cols-2">
                        {recordings.map((recording) => (
                          <label key={recording.id} className={`rounded-lg border p-3 ${draft.recordingId === recording.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-gray-700 bg-gray-950/35'}`}>
                            <div className="flex items-start gap-3">
                              <input type="radio" name={`recording-${review.id}`} checked={draft.recordingId === recording.id} onChange={() => updateDraft(review.id, { recordingId: recording.id })} className="mt-1" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-white">{recording.matchType === 'exact' ? 'Linked challenge video' : 'Legacy time-matched video'}</div>
                                <div className="mt-1 text-xs text-gray-400">Uploaded {formatDateTime(recording.uploadedAt)} · {formatFileSize(recording.fileSizeBytes)}</div>
                                <div className="mt-1 text-xs font-medium text-amber-200">Deletes automatically {formatDateTime(recording.expiresAt)}</div>
                                <button type="button" onClick={() => openRecording(recording)} disabled={!!recordingOpeningId} className="mt-2 rounded-lg border border-blue-500/50 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/10 disabled:opacity-60">
                                  {recordingOpeningId === recording.id ? 'Opening…' : 'Open recording'}
                                </button>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {review.status === 'open' && recordings.length > 0 ? (
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                      <h3 className="text-sm font-semibold text-white">Verify after manual video review</h3>
                      <p className="mt-1 text-xs leading-5 text-gray-300">Watch the selected recording in full. Enter only clearly observed full squat reps. Approval is audited, may grant the one-time weekly credit, and never extends video retention.</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                        <label className="text-xs text-gray-300">Observed valid reps
                          <input type="number" min={thresholds.targetReps || 20} max={thresholds.maximumReps || 30} value={draft.verifiedReps ?? thresholds.targetReps ?? 20} onChange={(event) => updateDraft(review.id, { verifiedReps: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white" />
                        </label>
                        <label className="text-xs text-gray-300">Review note
                          <textarea value={draft.note || ''} onChange={(event) => updateDraft(review.id, { note: event.target.value })} rows={2} placeholder="What was visible in the recording?" className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white" />
                        </label>
                      </div>
                      <button type="button" onClick={() => manuallyVerify(review)} disabled={!!workingId || !draft.recordingId || String(draft.note || '').trim().length < 10} className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
                        {workingId === review.id ? 'Verifying…' : 'Verify after manual review'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )})}
        </div>
      )}
    </section>
  );
}

function ProgressionOnboardingPanel({ snapshot }) {
  const answers = snapshot?.answers && typeof snapshot.answers === 'object' ? snapshot.answers : null;
  const candidate = snapshot?.candidateStartingPoint || {};
  const assignment = snapshot?.experimentAssignment || null;
  const hasProgressionSnapshot = !!answers && snapshot?.validationConsent?.granted === true;

  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Progression onboarding snapshot</h3>
            <HelpTooltip
              label="About progression onboarding snapshots"
              text="Server-owned answers from the gated concept onboarding flow. This is validation data only; it does not change plan generation, SageScore, XP, ranks, or achievements."
            />
            <StatusChip tone={hasProgressionSnapshot ? 'emerald' : assignment ? 'blue' : 'gray'}>
              {hasProgressionSnapshot ? 'Captured' : assignment ? 'Assigned' : 'Not captured'}
            </StatusChip>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Review consent, the candidate starting point, and answer patterns for pilot research.
          </p>
        </div>
        {snapshot?.updatedAt ? <div className="text-right text-xs text-gray-500">Updated {formatDateTime(snapshot.updatedAt)}</div> : null}
      </div>

      {!snapshot ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-700 px-4 py-5 text-sm text-gray-400">
          This account has not completed the gated progression onboarding flow.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
            {assignment ? (
              <div className="mb-4 border-b border-gray-700 pb-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Experiment cohort</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip tone={assignment.variant === 'progression' ? 'emerald' : 'blue'}>{assignment.variant || 'Unknown'}</StatusChip>
                  <span className="text-xs text-gray-500">{assignment.experimentVersion || 'Unversioned'}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">Assignment: {assignment.assignmentMode || 'unknown'}</div>
              </div>
            ) : null}
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Candidate starting point</div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <div className="text-3xl font-semibold text-white">{candidate.score ?? '—'}</div>
                <div className="mt-1 text-sm text-gray-400">SageScore · {candidate.rank || 'Unrated'}</div>
              </div>
              {candidate.version ? <StatusChip tone="amber">{candidate.version}</StatusChip> : null}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Consent: <span className="text-emerald-200">{snapshot.validationConsent?.granted === true ? 'Granted' : 'Not granted'}</span>
            </div>
            {snapshot.validationConsent?.grantedAt ? <div className="mt-1 text-xs text-gray-500">Granted {formatDateTime(snapshot.validationConsent.grantedAt)}</div> : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {answers ? Object.entries(answers).map(([question, answer]) => (
              <div key={question} className="rounded-xl border border-gray-700 bg-gray-900/35 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{question.replace(/([A-Z])/g, ' $1')}</div>
                <div className="mt-1 text-sm font-medium text-gray-100">{String(answer || 'Not answered')}</div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-gray-700 px-4 py-5 text-sm text-gray-400 sm:col-span-2">
                {assignment?.variant === 'control'
                  ? 'Control cohort: the six-question progression answers are intentionally not collected.'
                  : 'The account has an experiment assignment, but no consented progression answers have been saved yet.'}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function GamificationProgressionPanel({ progression }) {
  const state = progression?.state || null;
  const score = state?.score || {};
  const xp = state?.xp || {};
  const achievements = progression?.recentAchievements || [];
  const personalRecords = progression?.recentPersonalRecords || [];
  const scoreHistory = progression?.recentScoreHistory || [];
  const verifiedResults = progression?.recentVerifiedChallengeResults || [];
  const weeklyChallengeProgress = progression?.weeklyChallengeProgress || [];
  const weeklyQuests = progression?.weeklyQuests || [];
  const sources = score?.componentSources || {};

  return (
    <section className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Gamification progression pilot</h3>
            <HelpTooltip
              label="About progression pilot data"
              text="Server-owned candidate SageScore, XP, achievements, and source classifications. Internal validation only; this is not a medical assessment, public ranking, or production promise."
            />
            <StatusChip tone={state ? 'violet' : 'gray'}>{state ? 'Calculated' : 'No state'}</StatusChip>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Audit the current candidate state and confirm recorded, self-reported, and SageSet Verified inputs remain distinct.
          </p>
        </div>
        {state?.updatedAt ? <div className="text-right text-xs text-gray-500">Updated {formatDateTime(state.updatedAt)}</div> : null}
      </div>

      {!state ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-700 px-4 py-5 text-sm text-gray-400">
          No server-owned progression state has been calculated for this user. The enrolled user must open the gated progression pilot after the new functions are deployed.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {progression?.programRecords?.length > 0 && <div className="rounded-xl border border-gray-700 p-4">
            <h4 className="font-semibold text-white">Permanent program records</h4>
            {progression.programRecords.map((record) => <p key={record.id} className="mt-2 text-sm text-gray-300">{record.title} · {record.completedWorkouts} workouts · {record.adherencePercent}% adherence · {record.programXpEarned} awarded program XP · {formatDateTime(record.completedAt)}</p>)}
          </div>}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Candidate SageScore</div>
              <div className="mt-2 text-3xl font-semibold text-white">{score.value ?? '—'}</div>
              <div className="mt-1 text-sm text-violet-200">{score.rank || 'Unranked'} · {score.confidence ?? 0}% confidence</div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Level {xp.level ?? 1}</div>
              <div className="mt-2 text-3xl font-semibold text-white">{xp.total ?? 0} XP</div>
              <div className="mt-1 text-sm text-gray-400">{xp.xpToNextLevel ?? '—'} XP to Level {xp.nextLevel ?? '—'}</div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Achievements</div>
              <div className="mt-2 text-3xl font-semibold text-white">{state.achievements?.unlockedCount ?? 0}</div>
              <div className="mt-1 text-sm text-gray-400">{achievements.length} recent shown</div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Score snapshots</div>
              <div className="mt-2 text-3xl font-semibold text-white">{scoreHistory.length}</div>
              <div className="mt-1 text-sm text-gray-400">Recent immutable records</div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Personal records</div>
              <div className="mt-2 text-3xl font-semibold text-white">{state.activity?.personalRecords ?? 0}</div>
              <div className="mt-1 text-sm text-gray-400">Recorded, not AR verified</div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Current weekly quests</div>
                <StatusChip tone={state.weeklyQuest?.state === 'completed' ? 'emerald' : state.weeklyQuest ? 'blue' : 'gray'}>
                  {state.weeklyQuest?.state || 'not generated'}
                </StatusChip>
              </div>
              <div className="mt-3 space-y-2">
                {(state.weeklyQuest?.goals || []).map((quest) => (
                  <div key={quest.id} className="rounded-lg border border-gray-700 px-3 py-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-gray-100">{quest.title}</span>
                      <span className="text-cyan-200">{quest.current}/{quest.target}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{quest.category} · {quest.sourceClassification} · {quest.rewardXp} XP</div>
                  </div>
                ))}
                {!state.weeklyQuest?.goals?.length ? <div className="text-sm text-gray-500">No eligible quest set for this week.</div> : null}
              </div>
              {weeklyQuests.length > 1 ? <div className="mt-3 text-xs text-gray-500">{weeklyQuests.length} recent immutable weekly definitions available for support.</div> : null}
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <div className="text-sm font-semibold text-white">Consistency and next goal</div>
              <div className="mt-3 text-sm text-gray-200">{state.activity?.currentScheduledWorkoutStreak ?? 0}-workout consistency streak</div>
              <div className="mt-1 text-xs text-gray-500">Policy {state.activity?.consistencyPolicyVersion || 'legacy'} · protection used {state.activity?.streakProtection?.protectionUsed ? 'yes' : 'no'}</div>
              {state.nearTermGoal ? (
                <div className="mt-3 rounded-lg border border-gray-700 px-3 py-2">
                  <div className="text-sm font-medium text-gray-100">{state.nearTermGoal.title}</div>
                  <div className="mt-1 text-xs text-gray-400">{state.nearTermGoal.message}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
              <div className="text-sm font-semibold text-white">Component provenance</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.entries(sources).map(([component, sourceDetails]) => {
                  const source = typeof sourceDetails === 'string' ? sourceDetails : sourceDetails?.classification || 'unknown';
                  const label = typeof sourceDetails === 'object' && sourceDetails?.label ? sourceDetails.label : String(source).replaceAll('_', ' ');
                  return (
                    <div key={component} className="rounded-lg border border-gray-700 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-300">{component.replace(/([A-Z])/g, ' $1')}</span>
                        <StatusChip tone={source === 'sageset_verified' ? 'emerald' : source === 'not_available' ? 'gray' : 'blue'}>{String(source).replaceAll('_', ' ')}</StatusChip>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
              <div className="text-sm font-semibold text-white">Recent achievements</div>
              <div className="mt-3 space-y-2">
                {achievements.length ? achievements.map((achievement) => (
                  <div key={achievement.id} className="rounded-lg border border-gray-700 px-3 py-2">
                    <div className="text-sm font-medium text-gray-100">{achievement.title || achievement.definitionId}</div>
                    <div className="mt-1 text-xs text-gray-500">{achievement.sourceClassification || 'unknown source'} · {formatDateTime(achievement.unlockedAt)}</div>
                  </div>
                )) : <div className="text-sm text-gray-500">No achievements unlocked yet.</div>}
              </div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
              <div className="text-sm font-semibold text-white">Recent personal records</div>
              <div className="mt-3 space-y-2">
                {personalRecords.length ? personalRecords.map((record) => (
                  <div key={record.id} className="rounded-lg border border-gray-700 px-3 py-2">
                    <div className="text-sm font-medium text-gray-100">{record.exerciseName || record.exerciseKey || 'Exercise'}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {record.lastImprovementTypes?.join(', ').replaceAll('_', ' ') || 'recorded best'} · {formatDateTime(record.lastRecordAt)}
                    </div>
                    <div className="mt-1 text-[11px] text-amber-300">Recorded · Not SageSet Verified</div>
                  </div>
                )) : <div className="text-sm text-gray-500">No post-baseline personal records yet.</div>}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-white">Verified weekly challenge evidence</div>
                <div className="mt-1 text-xs text-gray-400">Server-issued results only. Raw AR recordings and diagnostics remain separate review evidence.</div>
              </div>
              <StatusChip tone={verifiedResults.length ? 'emerald' : 'gray'}>{verifiedResults.length} recent results</StatusChip>
            </div>
            {weeklyChallengeProgress.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {weeklyChallengeProgress.map((item) => (
                  <StatusChip key={item.id} tone={item.completed ? 'emerald' : 'amber'}>
                    Week {item.weekId || '—'} · best {item.bestVerifiedReps || 0} · {item.completed ? 'complete' : 'open'}
                  </StatusChip>
                ))}
              </div>
            ) : null}
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              {verifiedResults.length ? verifiedResults.map((result) => (
                <div key={result.id} className="rounded-lg border border-gray-700 bg-gray-950/35 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-gray-100">
                      {result.reps || 0} {result.status === 'verified' ? 'verified' : 'recorded'} squat reps
                    </div>
                    <StatusChip tone={result.status === 'verified' ? 'emerald' : result.status === 'disputed' || result.status === 'under_review' ? 'amber' : 'gray'}>
                      {String(result.status || 'unknown').replaceAll('_', ' ')}
                    </StatusChip>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {result.confidence ?? 0}% confidence · {
                      result.creditEligible
                        ? 'XP credit awarded'
                        : result.status === 'verified' && result.completed
                          ? 'no repeat credit'
                          : 'no XP credit'
                    } · {formatDateTime(result.createdAt)}
                  </div>
                  {result.shareAggregate ? (
                    <div className="mt-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-2 text-[11px] text-emerald-100">
                      Invitation: {result.shareAggregate.uniqueOpens || 0} opened · {result.shareAggregate.accepted || 0} accepted · {result.shareAggregate.completed || 0} matched · {result.shareAggregate.registrations || 0} joined · {result.shareAggregate.secondaryShares || 0} shared onward
                    </div>
                  ) : null}
                  {Array.isArray(result.reasons) && result.reasons.length ? (
                    <div className="mt-2 text-xs text-amber-200">{result.reasons.join(' ')}</div>
                  ) : null}
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-gray-700 px-3 py-4 text-sm text-gray-500 lg:col-span-2">
                  No verified weekly challenge attempts have been submitted by this user.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SprintCoachRolloutPanel() {
  const [rollout, setRollout] = useState(null);
  const [draft, setDraft] = useState({
    minimumAppVersion: '1.2.12',
    maintenanceMessage: '',
    allowTesterAccess: true,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getSprintCoachRolloutForAdmin();
      const value = result?.rollout || {};
      setRollout(value);
      setDraft({
        minimumAppVersion: value.minimumAppVersion || '1.2.12',
        maintenanceMessage: value.maintenanceMessage || '',
        allowTesterAccess: value.allowTesterAccess !== false,
      });
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load Sprint Coach rollout.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (patch) => {
    setUpdating(true);
    setMessage('');
    setError('');
    try {
      const result = await updateSprintCoachRolloutForAdmin({
        minimumAppVersion: draft.minimumAppVersion,
        maintenanceMessage: draft.maintenanceMessage,
        allowTesterAccess: draft.allowTesterAccess,
        ...patch,
      });
      setRollout(result?.rollout || null);
      setMessage('Sprint Coach rollout policy updated.');
    } catch (saveError) {
      setError(saveError?.message || 'Unable to update Sprint Coach rollout.');
    } finally {
      setUpdating(false);
    }
  };

  const toggleGlobal = () => {
    const next = rollout?.globallyEnabled !== true;
    const detail = next
      ? 'This enables Sprint Coach only for users explicitly enrolled as testers. It does not make the feature public.'
      : 'This immediately hides Sprint Coach for all users. Active sessions can still be completed.';
    if (window.confirm(`${detail}\n\nContinue?`)) void save({ globallyEnabled: next });
  };

  return (
    <section className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Sprint Coach Early Access</h2>
            <HelpTooltip text="The master switch and per-user tester enrollment must both be enabled. Public and beta access remain disabled in this initial release." />
            <StatusChip tone={rollout?.globallyEnabled ? 'amber' : 'emerald'}>
              {loading ? 'Checking policy' : rollout?.globallyEnabled ? 'Tester rollout active' : 'Globally hidden'}
            </StatusChip>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
            Sprint Coach is fail-closed. Enrolling a user below has no effect until this tester rollout is active.
            Disabling the master switch hides the dashboard entry at the next sign-in, foreground refresh, notification,
            or five-minute poll.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusChip tone={rollout?.allowTesterAccess ? 'emerald' : 'gray'}>Tester access {rollout?.allowTesterAccess ? 'allowed' : 'blocked'}</StatusChip>
            <StatusChip tone="gray">Beta access {rollout?.allowBetaAccess ? 'allowed' : 'blocked'}</StatusChip>
            <StatusChip tone="gray">Public access {rollout?.allowPublicAccess ? 'allowed' : 'blocked'}</StatusChip>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} disabled={loading || updating} className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-100 disabled:opacity-60">Refresh</button>
          <button
            type="button"
            onClick={toggleGlobal}
            disabled={loading || updating}
            className={`rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-60 ${rollout?.globallyEnabled ? 'bg-red-700' : 'bg-emerald-700'}`}
          >
            {updating ? 'Updating…' : rollout?.globallyEnabled ? 'Disable globally' : 'Enable tester rollout'}
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 border-t border-cyan-500/20 pt-4 md:grid-cols-[220px_1fr_auto]">
        <label className="text-sm text-gray-300">
          Minimum app version
          <input value={draft.minimumAppVersion} onChange={(event) => setDraft((current) => ({ ...current, minimumAppVersion: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-gray-300">
          Maintenance message (optional)
          <input value={draft.maintenanceMessage} onChange={(event) => setDraft((current) => ({ ...current, maintenanceMessage: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white" />
        </label>
        <button type="button" onClick={() => save({})} disabled={updating} className="self-end rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Save policy</button>
      </div>
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}

function PlanPanel({ plan, expanded, onToggle, loading = false, error = '' }) {
  const stats = plan?.stats || {};
  const days = Array.isArray(plan?.days) ? plan.days : [];
  const detailsLoaded = plan?.detailsLoaded === true;

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800/80">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-5 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{formatPlanTitle(plan)}</h3>
            {plan?.active ? <StatusChip tone="emerald">Active</StatusChip> : null}
            {plan?.source ? <StatusChip tone="blue">{String(plan.source)}</StatusChip> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {detailsLoaded ? (
              <>
                <StatusChip>{stats.dayCount || 0} days</StatusChip>
                <StatusChip>{stats.workoutCount || 0} workouts</StatusChip>
                <StatusChip>{stats.exerciseCount || 0} exercises</StatusChip>
              </>
            ) : (
              <StatusChip tone="gray">Details load on demand</StatusChip>
            )}
            {plan?.startDate ? <StatusChip tone="amber">Starts {formatCompactDate(plan.startDate)}</StatusChip> : null}
          </div>
          <div className="mt-3 text-sm text-gray-400">
            Created {formatDateTime(plan?.createdAt)}
          </div>
        </div>
        <div className="rounded-xl bg-gray-900/60 p-2 text-gray-300">
          {expanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-gray-700 px-5 py-4">
          {loading ? (
            <LoadingProgress
              label={`Loading ${formatPlanTitle(plan)}`}
              detail="Gathering saved days, workouts, and exercises for this plan."
              progress={62}
            />
          ) : error ? (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : !detailsLoaded ? (
            <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-4 text-sm text-gray-400">
              Open this plan again to load its workout history.
            </div>
          ) : days.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-4 text-sm text-gray-400">
              This plan does not have saved day data yet.
            </div>
          ) : (
            <div className="space-y-4">
              {days.map((day) => (
                <div key={day.id} className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-medium text-white">
                        {day.dayLabel || day.workoutName || `Day ${day.order || '?'}`}
                      </div>
                      <div className="mt-1 text-sm text-gray-400">
                        {day.date ? formatCompactDate(day.date) : 'No date'}{day.type ? ` • ${day.type}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {day.isRestDay ? <StatusChip tone="amber">Rest day</StatusChip> : <StatusChip tone="blue">Workout day</StatusChip>}
                      {day.completed ? <StatusChip tone="emerald">Completed</StatusChip> : <StatusChip tone="rose">In progress</StatusChip>}
                    </div>
                  </div>

                  {Array.isArray(day.workouts) && day.workouts.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {day.workouts.map((workout) => (
                        <div key={workout.id} className="rounded-xl border border-gray-700 bg-gray-950/40 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-gray-100">
                                {workout.name || 'Workout'}
                              </div>
                              <div className="mt-1 text-sm text-gray-400">
                                {workout.type || 'General workout'}
                              </div>
                            </div>
                            <StatusChip tone="gray">
                              {workout.completedExercises || 0}/{workout.totalExercises || workout.exercises?.length || 0} complete
                            </StatusChip>
                          </div>

                          {Array.isArray(workout.exercises) && workout.exercises.length > 0 ? (
                            <div className="mt-4 space-y-2">
                              {workout.exercises.map((exercise) => (
                                <div
                                  key={exercise.id}
                                  className="rounded-lg border border-gray-800 bg-gray-900/70 px-3 py-2"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-medium text-white">
                                        {exercise.name || 'Exercise'}
                                      </div>
                                      <div className="mt-1 text-xs text-gray-400">
                                        {formatExercisePrescription(exercise)}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {exercise.executionMode ? (
                                        <StatusChip tone={exercise.executionMode === 'ar' ? 'amber' : 'gray'}>
                                          {String(exercise.executionMode).toUpperCase()}
                                        </StatusChip>
                                      ) : null}
                                      {exercise.isComplete ? (
                                        <StatusChip tone="emerald">Done</StatusChip>
                                      ) : (
                                        <StatusChip tone="rose">
                                          {exercise.completedSets || 0}/{exercise.sets || 0} sets
                                        </StatusChip>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-3 text-sm text-gray-500">No exercises saved for this workout.</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-gray-500">
                      {day.isRestDay ? 'No workouts expected for this rest day.' : 'No workouts saved for this day.'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminUsersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [hiddenDuplicateOrphans, setHiddenDuplicateOrphans] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersLoadingProgress, setUsersLoadingProgress] = useState(20);
  const [usersError, setUsersError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [detailCache, setDetailCache] = useState({});
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLoadingProgress, setDetailLoadingProgress] = useState(15);
  const [detailError, setDetailError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [expandedPlans, setExpandedPlans] = useState({});
  const [planLoadingId, setPlanLoadingId] = useState('');
  const [planLoadErrors, setPlanLoadErrors] = useState({});
  const [notificationTitle, setNotificationTitle] = useState('SageSet');
  const [notificationBody, setNotificationBody] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [accessActionLoading, setAccessActionLoading] = useState('');
  const [notifyARAccessChanges, setNotifyARAccessChanges] = useState(true);
  const [sprintCoachNotes, setSprintCoachNotes] = useState('');
  const [sprintCoachAccessLoading, setSprintCoachAccessLoading] = useState(false);
  const [reviewOpeningId, setReviewOpeningId] = useState('');
  const detailRequestRef = useRef(0);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const selectedSummary = useMemo(
    () => users.find((item) => item.uid === selectedUserId) || null,
    [selectedUserId, users]
  );

  const filteredUsers = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase();
    return users.filter((item) => {
      if (userFilter === 'sprint_enabled' && item.sprintCoachEnabled !== true) return false;
      if (userFilter === 'sprint_disabled' && item.sprintCoachEnabled === true) return false;
      if (!term) return true;
      return (
      [
        item.displayName,
        item.email,
        item.uid,
        item.activePlanTitle,
        item.authProvider,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
      );
    });
  }, [deferredSearchTerm, userFilter, users]);

  const stats = useMemo(
    () => ({
      total: users.length,
      withPlans: users.filter((item) => Number(item.planCount || 0) > 0).length,
      withPush: users.filter((item) => item.hasPushToken).length,
      verified: users.filter((item) => item.emailVerified).length,
    }),
    [users]
  );

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const selectUser = async (uid, { force = false } = {}) => {
    if (!uid) return;
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;

    setSelectedUserId(uid);
    setDetailError('');
    setActionMessage('');
    setActionError('');

    if (!force && detailCache[uid]) {
      setSelectedDetail(detailCache[uid]);
      setExpandedPlans({});
      return;
    }

    setSelectedDetail(null);
    setExpandedPlans({});
    setPlanLoadingId('');
    setPlanLoadErrors({});
    setDetailLoading(true);
    setDetailLoadingProgress(20);

    try {
      const detail = await getUserAdminDetail(uid);
      if (detailRequestRef.current !== requestId) return;
      setDetailLoadingProgress(85);
      setDetailCache((prev) => ({ ...prev, [uid]: detail }));
      setSelectedDetail(detail);
      setExpandedPlans({});
    } catch (error) {
      if (detailRequestRef.current !== requestId) return;
      console.warn('Failed to load user detail:', error);
      setDetailError(error?.message || 'Failed to load user detail.');
    } finally {
      if (detailRequestRef.current === requestId) {
        setDetailLoadingProgress(100);
        setDetailLoading(false);
      }
    }
  };

  const loadUsers = async ({ preserveSelection = true } = {}) => {
    setUsersLoading(true);
    setUsersLoadingProgress(18);
    setUsersError('');

    try {
      const result = await listUsersForAdmin(250);
      setUsersLoadingProgress(82);
      const nextUsers = Array.isArray(result?.users) ? result.users : [];
      setUsers(nextUsers);
      setHiddenDuplicateOrphans(Number(result?.hiddenDuplicateOrphans || 0));

      const preferredUserId =
        preserveSelection && nextUsers.some((item) => item.uid === selectedUserId)
          ? selectedUserId
          : nextUsers[0]?.uid || '';

      if (preferredUserId) {
        void selectUser(preferredUserId);
      } else {
        setSelectedUserId('');
        setSelectedDetail(null);
      }
    } catch (error) {
      console.warn('Failed to load admin users:', error);
      setUsersError(error?.message || 'Failed to load users.');
    } finally {
      setUsersLoadingProgress(100);
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers({ preserveSelection: false });
  }, []);

  const togglePlan = async (planId) => {
    const plan = selectedDetail?.plans?.find((item) => item.id === planId);
    const nextExpanded = !expandedPlans[planId];
    setExpandedPlans((prev) => ({ ...prev, [planId]: nextExpanded }));
    if (!nextExpanded || !plan || plan.detailsLoaded === true || planLoadingId) return;

    const uid = selectedUserId;
    const selectionRequestId = detailRequestRef.current;
    setPlanLoadingId(planId);
    setPlanLoadErrors((prev) => ({ ...prev, [planId]: '' }));
    try {
      const result = await getUserAdminPlanDetail(uid, planId);
      if (detailRequestRef.current !== selectionRequestId || !result?.plan) return;
      setSelectedDetail((current) => mergePlanDetail(current, result.plan));
      setDetailCache((prev) => ({
        ...prev,
        [uid]: mergePlanDetail(prev[uid], result.plan),
      }));
    } catch (error) {
      console.warn('Failed to load workout plan detail:', error);
      setPlanLoadErrors((prev) => ({
        ...prev,
        [planId]: error?.message || 'Failed to load this workout plan.',
      }));
    } finally {
      if (detailRequestRef.current === selectionRequestId) setPlanLoadingId('');
    }
  };

  const handleSendNotification = async () => {
    if (!selectedUserId) return;

    setSendingNotification(true);
    setActionMessage('');
    setActionError('');

    try {
      const result = await sendUserExpoNotification({
        uid: selectedUserId,
        title: notificationTitle.trim(),
        body: notificationBody.trim(),
      });

      const failedCount = Number(result?.failedCount || 0);
      const sentCount = Number(result?.sentCount || 0);
      const tokenCount = Number(result?.tokenCount || 0);

      if (failedCount > 0) {
        setActionError(`Sent to ${sentCount} device(s), but ${failedCount} ticket(s) failed.`);
      } else {
        setActionMessage(`Expo accepted ${sentCount || tokenCount} notification request(s). Final Apple/Google delivery is pending.`);
        setNotificationBody('');
      }
    } catch (error) {
      console.warn('Failed to send admin push notification:', error);
      setActionError(error?.message || 'Failed to send notification.');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleOpenSessionReview = async (review) => {
    if (!review?.storagePath || reviewOpeningId) return;
    const previewWindow = window.open('', '_blank', 'noopener,noreferrer');
    setReviewOpeningId(review.id);
    setActionError('');
    try {
      const blob = await loadARSessionReviewBlob(review.storagePath);
      const objectUrl = URL.createObjectURL(blob);
      if (previewWindow) {
        previewWindow.location.href = objectUrl;
      } else {
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10 * 60 * 1000);
    } catch (error) {
      previewWindow?.close();
      console.warn('Failed to open AR tester recording:', error);
      setActionError(
        error?.message || 'The tester recording could not be opened.'
      );
    } finally {
      setReviewOpeningId('');
    }
  };

  const handleAccessAction = async (action) => {
    if (!selectedUserId) return;
    setAccessActionLoading(action);
    setActionMessage('');
    setActionError('');

    try {
      const shouldNotify =
        notifyARAccessChanges &&
        (action === 'toggle_arkit_beta' || action === 'toggle_pushup_beta');
      const result = await updateUserAccessForAdmin({
        uid: selectedUserId,
        action,
        notifyUser: shouldNotify,
      });
      if (result?.rawUserData || result?.access) {
        setSelectedDetail((current) => {
          if (!current || current.profile?.uid !== selectedUserId) return current;

          const rawUserData = result.rawUserData || current.rawUserData || {};
          const demoAccess =
            typeof result.access?.demoAccess === 'boolean'
              ? result.access.demoAccess
              : rawUserData?.accountFlags?.demo === true;

          return {
            ...current,
            profile: {
              ...current.profile,
              isDemoAccount: demoAccess,
            },
            rawUserData: {
              ...current.rawUserData,
              ...rawUserData,
              accountFlags: {
                ...(current.rawUserData?.accountFlags || {}),
                ...(rawUserData?.accountFlags || {}),
                demo: demoAccess,
              },
              subscription: {
                ...(current.rawUserData?.subscription || {}),
                ...(rawUserData?.subscription || {}),
                source: result.access?.subscriptionSource ?? rawUserData?.subscription?.source ?? current.rawUserData?.subscription?.source,
                status: result.access?.subscriptionStatus ?? rawUserData?.subscription?.status ?? current.rawUserData?.subscription?.status,
              },
              trial: {
                ...(current.rawUserData?.trial || {}),
                ...(rawUserData?.trial || {}),
                status: result.access?.trialStatus ?? rawUserData?.trial?.status ?? current.rawUserData?.trial?.status,
              },
            },
          };
        });
      }
      setDetailCache((prev) => {
        const next = { ...prev };
        delete next[selectedUserId];
        return next;
      });
      await selectUser(selectedUserId, { force: true });
      const demoSuffix =
        action === 'toggle_demo_account' && typeof result?.access?.demoAccess === 'boolean'
          ? ` Demo account is now ${result.access.demoAccess ? 'enabled' : 'disabled'}.`
          : '';
      const actionLabels = {
        extend_trial_7: 'Trial extended by seven days.',
        grant_premium_7: 'Seven days of manual premium access granted.',
        revoke_premium: 'Manual premium access revoked.',
        toggle_demo_account: 'Demo-account access updated.',
        toggle_arkit_beta: 'AR squat feature access updated.',
        toggle_pushup_beta: 'Push-up feature access updated.',
        toggle_smart_return_beta: 'Smart Return feature access updated. Take a Break is unchanged.',
        toggle_gamification_concepts: 'Gamification concept tester access updated. No live scoring or XP was enabled.',
        recalculate: 'Entitlements recalculated.',
      };
      const notificationLabels = {
        sent: ' The user was notified.',
        skipped_disabled: ' Access changed; the user has push notifications disabled.',
        skipped_no_token: ' Access changed; this user has no saved push token.',
        failed: ' Access changed, but the push notification could not be delivered.',
      };
      const notificationSuffix =
        result?.notification?.requested === true
          ? notificationLabels[result.notification.status] || ''
          : '';
      setActionMessage(
        `${actionLabels[action] || 'Access updated.'}${demoSuffix}${notificationSuffix}`
      );
    } catch (error) {
      console.warn('Failed to update user access:', error);
      setActionError(error?.message || 'Failed to update user access.');
    } finally {
      setAccessActionLoading('');
    }
  };

  useEffect(() => {
    setSprintCoachNotes(
      selectedDetail?.rawUserData?.featureAccess?.sprintCoach?.notes || ''
    );
  }, [selectedDetail?.profile?.uid, selectedDetail?.rawUserData?.featureAccess?.sprintCoach?.notes]);

  const handleSprintCoachAccess = async (accessLevel) => {
    if (!selectedUserId) return;
    const enabled = accessLevel !== 'disabled';
    if (!window.confirm(
      enabled
        ? 'Grant this user Sprint Coach tester access? The global tester rollout must also be active.'
        : 'Remove Sprint Coach access for this user? An active session can still be completed.'
    )) return;
    setSprintCoachAccessLoading(true);
    setActionMessage('');
    setActionError('');
    try {
      await updateSprintCoachUserAccessForAdmin({
        uid: selectedUserId,
        accessLevel,
        notes: sprintCoachNotes,
      });
      setDetailCache((current) => {
        const next = { ...current };
        delete next[selectedUserId];
        return next;
      });
      await Promise.all([
        selectUser(selectedUserId, { force: true }),
        loadUsers({ preserveSelection: true }),
      ]);
      setActionMessage(
        enabled
          ? 'Sprint Coach tester access granted. The mobile app will refresh within five minutes while active.'
          : 'Sprint Coach access removed. The mobile app will refresh within five minutes while active.'
      );
    } catch (error) {
      setActionError(error?.message || 'Unable to update Sprint Coach access.');
    } finally {
      setSprintCoachAccessLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader userEmail={user?.email} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={UsersIcon} label="Total Users" value={stats.total} tone="emerald" help="Authentication accounts and non-duplicate profile-only records visible to this admin." />
          <StatCard icon={ClipboardDocumentListIcon} label="Users With Plans" value={stats.withPlans} tone="blue" help="Users with at least one saved plan. Plan counts are gathered in one batched query." />
          <StatCard icon={DevicePhoneMobileIcon} label="Push Ready" value={stats.withPush} tone="amber" help="Users whose profile contains at least one valid Expo push token." />
          <StatCard icon={UserCircleIcon} label="Verified Emails" value={stats.verified} tone="rose" help="Firebase Authentication accounts with a verified email address." />
        </div>

        <ARChallengeRolloutPanel />
        <GamificationFoundationPanel />
        <SageSetWeeklyChallengePanel />
        <GamificationIntegrityPanel />
        <GamificationRoadmapPanels />
        <SprintCoachRolloutPanel />

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/90">
            <div className="border-b border-gray-700 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Users</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {filteredUsers.length} of {users.length} shown
                  </p>
                  {hiddenDuplicateOrphans > 0 ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {hiddenDuplicateOrphans} duplicate auth-missing profile{hiddenDuplicateOrphans === 1 ? '' : 's'} hidden
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => loadUsers()}
                  disabled={usersLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="relative mt-4">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, email, provider, or uid"
                  className="w-full rounded-xl border border-gray-600 bg-gray-900/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <select
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
                className="mt-3 w-full rounded-xl border border-gray-600 bg-gray-900/70 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All users</option>
                <option value="sprint_enabled">Sprint Coach testers</option>
                <option value="sprint_disabled">Sprint Coach not enrolled</option>
              </select>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {usersLoading ? (
                <div className="p-4">
                  <LoadingProgress
                    label="Loading users"
                    detail="Gathering authentication profiles and batched plan summaries. The list will appear before any workout history is loaded."
                    progress={usersLoadingProgress}
                  />
                </div>
              ) : usersError ? (
                <div className="p-6 text-sm text-red-300">{usersError}</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-6 text-sm text-gray-400">No users match your search.</div>
              ) : (
                filteredUsers.map((item) => {
                  const isSelected = item.uid === selectedUserId;
                  return (
                    <button
                      key={item.uid}
                      type="button"
                      onClick={() => selectUser(item.uid)}
                      className={`block w-full border-b border-gray-700 px-4 py-4 text-left transition last:border-b-0 ${
                        isSelected ? 'bg-emerald-500/10' : 'hover:bg-gray-700/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">
                            {formatUserLabel(item)}
                          </div>
                          <div className="mt-1 truncate text-xs text-gray-400">
                            {item.email || item.uid}
                          </div>
                        </div>
                        <div className={`mt-1 h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {Number(item.planCount || 0) > 0 ? (
                          <StatusChip tone="blue">{item.planCount} plan(s)</StatusChip>
                        ) : (
                          <StatusChip>No plans</StatusChip>
                        )}
                        {item.hasPushToken ? <StatusChip tone="amber">Push ready</StatusChip> : null}
                        {item.emailVerified ? <StatusChip tone="emerald">Verified</StatusChip> : null}
                        {item.isDemoAccount ? <StatusChip tone="emerald">Demo</StatusChip> : null}
                        {item.authRecordMissing ? <StatusChip tone="rose">Auth missing</StatusChip> : null}
                      </div>

                      {item.activePlanTitle ? (
                        <div className="mt-3 text-xs text-gray-500">
                          Active plan: <span className="text-gray-300">{item.activePlanTitle}</span>
                        </div>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="space-y-6">
            {detailLoading ? (
              <LoadingProgress
                label={`Loading ${formatUserLabel(selectedSummary)}`}
                detail="Loading the account profile, settings, access status, and lightweight plan list. Full workout history loads only when a plan is opened."
                progress={detailLoadingProgress}
              />
            ) : detailError ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-6 text-sm text-red-200">
                {detailError}
              </div>
            ) : (
              <>
                {selectedDetail ? (
                  <>
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                      <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h2 className="text-2xl font-semibold text-white">
                              {formatUserLabel(selectedDetail.profile)}
                            </h2>
                            <p className="mt-2 text-sm text-gray-400">
                              {selectedDetail.profile?.email || 'No email available'}
                            </p>
                            {selectedDetail.rawUserData?.sageSetName ? (
                              <p className="mt-1 text-sm font-semibold text-emerald-300">@{selectedDetail.rawUserData.sageSetName}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => selectUser(selectedUserId, { force: true })}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-600"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                            Reload Detail
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedDetail.profile?.emailVerified ? (
                            <StatusChip tone="emerald">Email verified</StatusChip>
                          ) : (
                            <StatusChip tone="rose">Email unverified</StatusChip>
                          )}
                          {selectedDetail.profile?.disabled ? (
                            <StatusChip tone="rose">Account disabled</StatusChip>
                          ) : (
                            <StatusChip tone="blue">Account active</StatusChip>
                          )}
                          {selectedDetail.notifications?.hasPushToken ? (
                            <StatusChip tone="amber">
                              {selectedDetail.notifications.pushTokenCount} push token(s)
                            </StatusChip>
                          ) : (
                            <StatusChip>No push token</StatusChip>
                          )}
                          {selectedDetail.profile?.isDemoAccount ? (
                            <StatusChip tone="emerald">Demo access</StatusChip>
                          ) : null}
                          {selectedDetail.rawUserData?.betaFlags?.arkitChallenges === true || selectedDetail.rawUserData?.featureFlags?.arkitChallengesEnabled === true ? (
                            <StatusChip tone="amber">AR squat tester</StatusChip>
                          ) : null}
                          {selectedDetail.rawUserData?.betaFlags?.arkitPushups === true ? (
                            <StatusChip tone="amber">Push-up tester</StatusChip>
                          ) : null}
                          {selectedDetail.rawUserData?.betaFlags?.smartReturn === true ? (
                            <StatusChip tone="blue">Smart Return check-in tester</StatusChip>
                          ) : null}
                          {selectedDetail.rawUserData?.betaFlags?.gamificationConcepts === true || selectedDetail.rawUserData?.featureFlags?.gamificationConceptsEnabled === true ? (
                            <StatusChip tone="blue">Gamification concepts tester</StatusChip>
                          ) : null}
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <StatCard icon={ClipboardDocumentListIcon} label="Plans" value={selectedDetail.stats?.planCount || 0} tone="blue" help="Saved plan documents for this user." />
                          <StatCard icon={ClipboardDocumentListIcon} label="Active Plans" value={selectedDetail.stats?.activePlanCount || 0} tone="emerald" help="Plans currently marked active." />
                          <StatCard icon={ClipboardDocumentListIcon} label="Loaded Workout Days" value={selectedDetail.stats?.loadedPlanCount ? selectedDetail.stats?.dayCount || 0 : '—'} tone="amber" help="Workout days from plans opened during this session. Open a plan below to load its history." />
                          <StatCard icon={ClipboardDocumentListIcon} label="Loaded Exercises" value={selectedDetail.stats?.loadedPlanCount ? selectedDetail.stats?.exerciseCount || 0 : '—'} tone="rose" help="Exercises from plans opened during this session. History is loaded on demand for faster profile access." />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-emerald-500/15 p-3 text-emerald-300">
                            <BellAlertIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">Send Expo Notification</h3>
                            <p className="mt-1 text-sm text-gray-400">
                              Sends to all saved Expo tokens for this user.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-4">
                          <div className="rounded-xl border border-gray-700 bg-gray-900/40 px-4 py-3 text-sm text-gray-300">
                            {selectedDetail.notifications?.hasPushToken
                              ? `${selectedDetail.notifications.pushTokenCount} token(s) available`
                              : 'No saved Expo push tokens were found for this user.'}
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-gray-400">Title</label>
                            <input
                              type="text"
                              value={notificationTitle}
                              onChange={(event) => setNotificationTitle(event.target.value)}
                              className="w-full rounded-xl border border-gray-600 bg-gray-900/70 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                              placeholder="SageSet"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm text-gray-400">Message</label>
                            <textarea
                              value={notificationBody}
                              onChange={(event) => setNotificationBody(event.target.value)}
                              rows={5}
                              className="w-full rounded-xl border border-gray-600 bg-gray-900/70 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                              placeholder="Write a short admin message for the user."
                            />
                          </div>

                          {actionMessage ? (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                              {actionMessage}
                            </div>
                          ) : null}
                          {actionError ? (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                              {actionError}
                            </div>
                          ) : null}

                          <button
                            type="button"
                            onClick={handleSendNotification}
                            disabled={
                              sendingNotification ||
                              !selectedDetail.notifications?.hasPushToken ||
                              !notificationTitle.trim() ||
                              !notificationBody.trim()
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                          >
                            <BellAlertIcon className="h-5 w-5" />
                            {sendingNotification ? 'Sending...' : 'Send Notification'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <ProgressionOnboardingPanel snapshot={selectedDetail.progressionOnboarding} />

                    <GamificationProgressionPanel progression={selectedDetail.gamificationProgression} />

                    <BillingManagementPanel
                      uid={selectedUserId}
                      userEmail={selectedDetail.profile?.email}
                      onUserDataChanged={() => selectUser(selectedUserId, { force: true })}
                    />

                    <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
                      <SectionHeading help="Membership changes, test enrollments, and entitlement maintenance are grouped separately to reduce accidental changes.">
                        Access Controls
                      </SectionHeading>
                      <p className="mt-2 text-sm text-gray-400">
                        Hover or focus a <QuestionMarkCircleIcon className="inline h-4 w-4 align-text-bottom" /> icon for an explanation.
                      </p>

                      <div className="mt-5 grid gap-4 xl:grid-cols-3">
                        <section className="rounded-xl border border-gray-700 bg-gray-900/25 p-4">
                          <SectionHeading help="Temporary trial and subscription overrides. These affect premium entitlement calculations.">
                            Membership
                          </SectionHeading>
                          <div className="mt-3">
                            <DetailRow label="Trial" value={selectedDetail.rawUserData?.trial?.status || 'Not set'} help="The current trial state stored on the user profile." />
                            <DetailRow label="Subscription" value={selectedDetail.rawUserData?.subscription?.status || 'Not set'} help="The current calculated premium subscription state." />
                            <DetailRow label="Source" value={selectedDetail.rawUserData?.subscription?.source || 'Not set'} help="Where the current subscription entitlement originated, such as Apple, Stripe, demo, or a manual admin grant." />
                          </div>
                          <div className="mt-4 grid gap-3">
                            <AccessActionButton action="extend_trial_7" label="Extend trial 7 days" help="Moves the trial end date forward seven days and marks the trial active." onAction={handleAccessAction} loadingAction={accessActionLoading} tone="blue" />
                            <AccessActionButton action="grant_premium_7" label="Grant premium 7 days" help="Creates a seven-day manual premium entitlement without changing an App Store or Stripe subscription." onAction={handleAccessAction} loadingAction={accessActionLoading} tone="emerald" />
                            <AccessActionButton action="revoke_premium" label="Revoke manual premium" help="Expires the calculated premium and trial status. This does not cancel an external Apple or Stripe subscription." onAction={handleAccessAction} loadingAction={accessActionLoading} tone="red" />
                          </div>
                        </section>

                        <section className="rounded-xl border border-gray-700 bg-gray-900/25 p-4">
                          <SectionHeading help="Per-user access to demo behavior and capabilities that are moving through a controlled rollout. The mobile app refreshes on sign-in, foreground resume, every five minutes while active, and whenever Challenges opens.">
                            Feature Access
                          </SectionHeading>
                          <div className="mt-3">
                            <DetailRow label="Demo Account" value={selectedDetail.rawUserData?.accountFlags?.demo ? 'Enabled' : 'Disabled'} help="Grants demo-account entitlement behavior. It is separate from AR and Smart Return testing." />
                            <DetailRow label="AR Squat Test" value={selectedDetail.rawUserData?.betaFlags?.arkitChallenges === true || selectedDetail.rawUserData?.featureFlags?.arkitChallengesEnabled === true ? 'Enrolled' : 'Not enrolled'} help="Allows this user to test AR squats while the AR master rollout is enabled." />
                            <DetailRow label="Push-up Test" value={selectedDetail.rawUserData?.betaFlags?.arkitPushups === true ? 'Enrolled' : 'Not enrolled'} help="Allows this user to test AR push-ups while the AR master rollout is enabled." />
                            <DetailRow label="Smart Return Check-in Test" value={selectedDetail.rawUserData?.betaFlags?.smartReturn === true ? 'Enrolled' : 'Not enrolled'} help="Enables the enhanced return check-in and recommendations after a break. Take a Break itself remains available even when this is disabled." />
                            <DetailRow label="Gamification Concepts Test" value={selectedDetail.rawUserData?.betaFlags?.gamificationConcepts === true || selectedDetail.rawUserData?.featureFlags?.gamificationConceptsEnabled === true ? 'Enrolled' : 'Not enrolled'} help="Marks this account as an internal progression tester. When the server pilot and concept-enabled mobile build are also active, private SageScore, XP, and achievement state can be calculated. Public rollout remains separate." />
                            <DetailRow
                              label="Sprint Coach"
                              value={selectedDetail.rawUserData?.featureAccess?.sprintCoach?.enabled === true ? `Enrolled (${selectedDetail.rawUserData?.featureAccess?.sprintCoach?.accessLevel || 'tester'})` : 'Not enrolled'}
                              help="Per-user Sprint Coach enrollment. Access also requires the global Sprint Coach tester rollout to be active."
                            />
                            <DetailRow
                              label="Sprint Coach enabled"
                              value={formatDateTime(selectedDetail.rawUserData?.featureAccess?.sprintCoach?.enabledAt)}
                              help="The time this account was most recently granted Sprint Coach access."
                            />
                          </div>
                          <div className="mt-4 grid gap-3">
                            <AccessActionButton action="toggle_demo_account" label={selectedDetail.rawUserData?.accountFlags?.demo ? 'Disable demo account' : 'Enable demo account'} help="Toggles this user's demo-account entitlement." onAction={handleAccessAction} loadingAction={accessActionLoading} />
                            <AccessActionButton action="toggle_arkit_beta" label={selectedDetail.rawUserData?.betaFlags?.arkitChallenges === true || selectedDetail.rawUserData?.featureFlags?.arkitChallengesEnabled === true ? 'Remove AR squat access' : 'Grant AR squat access'} help="Toggles per-user AR squat access during controlled rollout. The global AR master switch must also be enabled. If the notification option below is selected, SageSet sends an informational push when possible." onAction={handleAccessAction} loadingAction={accessActionLoading} />
                            <AccessActionButton action="toggle_pushup_beta" label={selectedDetail.rawUserData?.betaFlags?.arkitPushups === true ? 'Remove push-up access' : 'Grant push-up access'} help="Toggles per-user AR push-up access during controlled rollout. The global AR master switch must also be enabled. If the notification option below is selected, SageSet sends an informational push when possible." onAction={handleAccessAction} loadingAction={accessActionLoading} />
                            <AccessActionButton action="toggle_smart_return_beta" label={selectedDetail.rawUserData?.betaFlags?.smartReturn === true ? 'Remove Smart Return access' : 'Grant Smart Return access'} help="Toggles only the Smart Return check-in and recommendations. It does not remove the Take a Break action." onAction={handleAccessAction} loadingAction={accessActionLoading} />
                            <AccessActionButton action="toggle_gamification_concepts" label={selectedDetail.rawUserData?.betaFlags?.gamificationConcepts === true || selectedDetail.rawUserData?.featureFlags?.gamificationConceptsEnabled === true ? 'Remove gamification tester access' : 'Grant gamification tester access'} help="Enrolls or removes this user from the internal pilot. Enrollment never bypasses the global server policy or build-time concept gate, and it does not enable public access." onAction={handleAccessAction} loadingAction={accessActionLoading} tone="blue" />
                          </div>
                          <div className="mt-4 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                              Sprint Coach tester access
                              <HelpTooltip text="Initial release supports disabled or tester access only. Public and beta levels remain controlled by backend rollout policy." />
                            </div>
                            <textarea
                              value={sprintCoachNotes}
                              onChange={(event) => setSprintCoachNotes(event.target.value)}
                              placeholder="Internal tester notes"
                              rows={3}
                              className="mt-3 w-full rounded-lg border border-gray-600 bg-gray-950/60 px-3 py-2 text-sm text-white placeholder-gray-500"
                            />
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={sprintCoachAccessLoading}
                                onClick={() => handleSprintCoachAccess('tester')}
                                className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                              >
                                {sprintCoachAccessLoading ? 'Working…' : 'Grant tester access'}
                              </button>
                              <button
                                type="button"
                                disabled={sprintCoachAccessLoading}
                                onClick={() => handleSprintCoachAccess('disabled')}
                                className="rounded-lg bg-red-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                              >
                                Remove access
                              </button>
                            </div>
                          </div>
                          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-700 bg-gray-950/35 p-3 text-sm text-gray-300">
                            <input
                              type="checkbox"
                              checked={notifyARAccessChanges}
                              onChange={(event) => setNotifyARAccessChanges(event.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>
                              Notify user about AR access changes
                              <span className="mt-1 block text-xs leading-5 text-gray-500">
                                Applies to squat and push-up tester access. Delivery requires the user to have push notifications enabled and a valid device token.
                              </span>
                            </span>
                          </label>
                        </section>

                        <section className="rounded-xl border border-gray-700 bg-gray-900/25 p-4">
                          <SectionHeading help="Administrative repair and recalculation tools. These do not directly toggle a single feature.">
                            Maintenance
                          </SectionHeading>
                          <p className="mt-3 text-sm leading-6 text-gray-400">
                            Recalculate refreshes derived trial and subscription entitlements from the user’s current account data.
                          </p>
                          <div className="mt-4">
                            <AccessActionButton action="recalculate" label="Recalculate entitlements" help="Re-runs entitlement calculation without changing tester enrollment flags." onAction={handleAccessAction} loadingAction={accessActionLoading} tone="blue" />
                          </div>
                        </section>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
                      <SectionHeading help="Video-only clips that testers explicitly chose to upload after an AR challenge. Recordings expire automatically after 14 days.">
                        AR Tester Session Reviews
                      </SectionHeading>
                      <p className="mt-2 text-sm text-gray-400">
                        These clips contain no microphone audio. Opening a clip
                        uses your current admin session and does not create a
                        public download link.
                      </p>
                      <div className="mt-4 grid gap-3">
                        {Array.isArray(selectedDetail.arSessionReviews) &&
                        selectedDetail.arSessionReviews.length > 0 ? (
                          selectedDetail.arSessionReviews.map((review) => (
                            <div
                              key={review.id}
                              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-700 bg-gray-900/40 p-4"
                            >
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-300">
                                  <VideoCameraIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-medium text-white">
                                    {review.exercise || 'AR challenge'} •{' '}
                                    {review.cameraPosition || 'camera'}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-400">
                                    {formatDateTime(review.uploadedAt || review.createdAt)}
                                    {' • '}
                                    {formatFileSize(review.fileSizeBytes)}
                                    {' • '}
                                    {Number(review.reps || 0)} reps
                                  </div>
                                  <div className="mt-1 text-xs text-amber-300">
                                    Expires {formatDateTime(review.expiresAt)}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenSessionReview(review)}
                                disabled={Boolean(reviewOpeningId)}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-wait disabled:bg-gray-700"
                              >
                                <VideoCameraIcon className="h-4 w-4" />
                                {reviewOpeningId === review.id ? 'Opening...' : 'Open Recording'}
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-700 px-4 py-6 text-center text-sm text-gray-400">
                            No active tester recordings for this user.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
                        <h3 className="text-lg font-semibold text-white">Account Details</h3>
                        <div className="mt-4">
                          <DetailRow label="UID" value={selectedDetail.profile?.uid} mono />
                          <DetailRow label="SageSet Name" value={selectedDetail.rawUserData?.sageSetName ? `@${selectedDetail.rawUserData.sageSetName}` : 'Not set'} />
                          <DetailRow label="Provider" value={selectedDetail.profile?.authProvider} />
                          <DetailRow label="Created" value={formatDateTime(selectedDetail.profile?.createdAt)} />
                          <DetailRow label="Last Sign-In" value={formatDateTime(selectedDetail.profile?.lastSignInAt)} />
                          <DetailRow label="Profile Document" value={selectedDetail.profile?.hasProfileDoc ? 'Present' : 'Missing'} />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
                        <h3 className="text-lg font-semibold text-white">Settings</h3>
                        <div className="mt-4">
                          <DetailRow label="Units" value={selectedDetail.settings?.units} />
                          <DetailRow label="Timezone" value={selectedDetail.settings?.timezone} />
                          <DetailRow
                            label="Notifications Enabled"
                            value={selectedDetail.settings?.notificationsEnabled ? 'Yes' : 'No'}
                          />
                          <DetailRow
                            label="Reminder Sync Enabled"
                            value={selectedDetail.settings?.remindersEnabled ? 'Yes' : 'No'}
                          />
                          <DetailRow
                            label="Reminder Times"
                            value={selectedDetail.settings?.reminderTimes?.join(', ')}
                          />
                          <DetailRow
                            label="Disclaimer Accepted"
                            value={formatDateTime(selectedDetail.settings?.disclaimerAcceptedAt)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
                      <h3 className="text-lg font-semibold text-white">Goals</h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
                          <div className="text-sm text-gray-400">Start Weight</div>
                          <div className="mt-2 text-lg font-medium text-white">
                            {selectedDetail.goal?.startWeight ?? 'Not set'}
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
                          <div className="text-sm text-gray-400">Target Weight</div>
                          <div className="mt-2 text-lg font-medium text-white">
                            {selectedDetail.goal?.targetWeight ?? 'Not set'}
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
                          <div className="text-sm text-gray-400">Goal Start Date</div>
                          <div className="mt-2 text-lg font-medium text-white">
                            {selectedDetail.goal?.startDate || 'Not set'}
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
                          <div className="text-sm text-gray-400">Goal Target Date</div>
                          <div className="mt-2 text-lg font-medium text-white">
                            {selectedDetail.goal?.targetDate || 'Not set'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">Workout Plans</h3>
                        <p className="mt-1 text-sm text-gray-400">
                          Plan headers load with the profile. Open a plan to load its days, workouts, and exercises.
                        </p>
                      </div>

                      {Array.isArray(selectedDetail.plans) && selectedDetail.plans.length > 0 ? (
                        selectedDetail.plans.map((plan) => (
                          <PlanPanel
                            key={plan.id}
                            plan={plan}
                            expanded={!!expandedPlans[plan.id]}
                            onToggle={() => togglePlan(plan.id)}
                            loading={planLoadingId === plan.id}
                            error={planLoadErrors[plan.id] || ''}
                          />
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-800/60 p-6 text-sm text-gray-400">
                          This user does not have any saved workout plans yet.
                        </div>
                      )}
                    </div>

                    <details className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
                      <summary className="cursor-pointer text-lg font-semibold text-white">
                        Raw User Document
                      </summary>
                      <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-950/80 p-4 text-xs text-gray-300">
                        {JSON.stringify(selectedDetail.rawUserData || {}, null, 2)}
                      </pre>
                    </details>
                  </>
                ) : (
                  <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-8 text-sm text-gray-400">
                    Select a user to view their profile and plans.
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
