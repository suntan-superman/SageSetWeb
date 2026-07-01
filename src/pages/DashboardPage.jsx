import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import '../utils/syncfusionScheduleRuntime.js';
import {
  Agenda,
  Day,
  Inject,
  Month,
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Week,
} from '@syncfusion/ej2-react-schedule';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CreditCardIcon,
  FireIcon,
  HeartIcon,
  PrinterIcon,
  ShareIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, getDaysRemaining } from '../utils/date.js';
import { loadBillingStatus, openCustomerPortal, refreshEntitlements, startCheckout } from '../services/billing.js';
import { formatWorkoutShareText, loadMemberDashboard } from '../services/memberDashboard.js';
import { acceptPlanReview, dismissPlanReview, loadRecentPlanReviews, requestPlanReview } from '../services/planReviews.js';

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
  const [memberDashboard, setMemberDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.uid) return;
      setDashboardLoading(true);
      setDashboardError('');
      try {
        const nextDashboard = await loadMemberDashboard(user.uid);
        if (!cancelled) {
          setMemberDashboard(nextDashboard);
        }
      } catch (err) {
        console.warn('Member dashboard load failed:', err);
        if (!cancelled) {
          setDashboardError('Live workout data could not be loaded. Showing saved account metrics where available.');
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const data = billing || userData || {};
  const trial = data.trial || userData?.trial || {};
  const subscription = data.subscription || userData?.subscription || {};
  const entitlements = data.entitlements || userData?.entitlements || {};
  const storedMetrics = data.metrics || userData?.metrics || {};
  const liveSummary = memberDashboard?.summary || {};
  const goal = userData?.goal || {};
  const trialDaysRemaining = getDaysRemaining(trial.endsAt);
  const hasAccess = entitlements.premium === true || subscription.status === 'active' || trial.status === 'active';
  const checkoutResult = new URLSearchParams(location.search).get('checkout');
  const displayName = userData?.firstName || userData?.displayName?.split(' ')?.[0] || user?.displayName?.split(' ')?.[0] || 'there';
  const currentDayNumber = Math.max(1, Number(liveSummary.currentDayNumber || trial.dayNumber || 1));
  const totalPlanDays = Number(liveSummary.totalPlanDays || 75);
  const daysRemaining = liveSummary.totalPlanDays ? liveSummary.daysRemaining : trialDaysRemaining;
  const startWeight = Number(goal.startWeight || 0);
  const targetWeight = Number(goal.targetWeight || 0);
  const currentWeight = liveSummary.currentWeight || startWeight || null;
  const weightRemaining = currentWeight && targetWeight ? Math.abs(Number(currentWeight) - targetWeight).toFixed(1) : null;

  const metrics = {
    workoutsCompleted: liveSummary.workoutsCompleted ?? storedMetrics.workoutsCompleted ?? 0,
    mealsLogged: liveSummary.mealsLogged ?? storedMetrics.mealsLogged ?? 0,
    streakDays: liveSummary.currentStreak ?? storedMetrics.streakDays ?? 0,
    compliancePct: liveSummary.compliancePct ?? 0,
    plannedWorkoutsElapsed: liveSummary.plannedWorkoutsElapsed ?? 0,
    weeklyCompletedWorkoutDays: liveSummary.weeklyCompletedWorkoutDays ?? 0,
    weeklyWorkoutDays: liveSummary.weeklyWorkoutDays ?? 0,
    nutritionDays: liveSummary.nutritionDays ?? 0,
  };

  const cards = useMemo(
    () => [
      { label: 'Days remaining', value: daysRemaining ?? '—', icon: FireIcon },
      { label: 'Workouts completed', value: metrics.workoutsCompleted, icon: HeartIcon },
      { label: 'Meals logged', value: metrics.mealsLogged, icon: ChartBarIcon },
      { label: 'Current streak', value: metrics.streakDays, icon: FireIcon },
      {
        label: targetWeight ? 'Goal weight' : 'Current weight',
        value: targetWeight ? `${targetWeight} lbs` : currentWeight ? `${currentWeight} lbs` : 'Set goal',
        icon: ChartBarIcon,
      },
    ],
    [currentWeight, daysRemaining, metrics.mealsLogged, metrics.streakDays, metrics.workoutsCompleted, targetWeight]
  );

  const refresh = async () => {
    setBusy(true);
    setError('');
    try {
      const profile = await refreshUserData?.();
      if (user?.uid) {
        setMemberDashboard(await loadMemberDashboard(user.uid));
      }
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
              Good morning, {displayName}.
            </h1>
            <p className="mt-2 text-gray-600">
              You're on Day {currentDayNumber}{totalPlanDays ? ` of ${totalPlanDays}` : ''} of your SageSet fitness journey.
            </p>
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
        {dashboardError ? <StatusBanner tone="warning" text={dashboardError} /> : null}

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
          <ProgressPanel metrics={metrics} summary={liveSummary} loading={dashboardLoading} />
        ) : section === 'workouts' ? (
          <WorkoutsPanel dashboard={memberDashboard} loading={dashboardLoading} onReload={refresh} />
        ) : section === 'nutrition' ? (
          <NutritionPanel dashboard={memberDashboard} metrics={metrics} loading={dashboardLoading} />
        ) : (
          <Overview
            cards={cards}
            trial={trial}
            subscription={subscription}
            hasAccess={hasAccess}
            displayName={displayName}
            daysRemaining={daysRemaining}
            streakDays={metrics.streakDays}
            weightRemaining={weightRemaining}
            compliancePct={metrics.compliancePct}
          />
        )}
      </div>
    </section>
  );
}

function Overview({ cards, trial, subscription, hasAccess, displayName, daysRemaining, streakDays, weightRemaining, compliancePct }) {
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-sage-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sage-700">Coach recommendation</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {hasAccess ? `Let's build something great, ${displayName}.` : 'Your trial has ended.'}
            </h2>
            <p className="mt-2 text-gray-600">
              {hasAccess
                ? "Today's focus: complete the planned workout and log one meal so SageSet can keep learning your rhythm."
                : 'Refresh billing status or manage billing to continue your plan.'}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <CoachStat label="Days left" value={`${daysRemaining ?? 0} remain`} />
              <CoachStat label="Current streak" value={`${streakDays} days`} />
              <CoachStat label="Compliance" value={`${compliancePct}%`} />
              <CoachStat label="Weight goal" value={weightRemaining ? `${weightRemaining} lbs remaining` : 'Set in account'} />
            </div>
          </div>
          <div className="rounded-xl bg-gray-950 p-5 text-white">
            <p className="text-sm font-semibold text-sage-300">Sage says</p>
            <p className="mt-3 text-lg font-bold">
              {hasAccess ? "You're one completed session away from stronger momentum." : 'Your progress is saved and ready when access is active.'}
            </p>
            <p className="mt-3 text-sm text-gray-300">Trial ends {formatDate(trial.endsAt)}. Subscription status: {subscription.status || 'none'}.</p>
            <Link to="/dashboard/billing" className="mt-5 inline-flex rounded-lg bg-sage-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-600">
              Manage billing
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
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

function ProgressPanel({ metrics, summary, loading }) {
  return (
    <SectionShell icon={ChartBarIcon} title="Progress" subtitle="Live totals from the same workout plan data used by the mobile app." loading={loading}>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Completed workouts" value={metrics.workoutsCompleted} />
        <Stat label="Planned workout days" value={metrics.plannedWorkoutsElapsed} />
        <Stat label="Current streak" value={`${metrics.streakDays} days`} />
        <Stat label="Compliance" value={`${metrics.compliancePct}%`} />
      </div>
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">This week</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {summary.weeklyCompletedWorkoutDays || 0} of {summary.weeklyWorkoutDays || 0} planned workout days completed
        </p>
      </div>
    </SectionShell>
  );
}

function NutritionPanel({ dashboard, metrics, loading }) {
  const recentLogs = dashboard?.foodLogs?.slice(0, 5) || [];

  return (
    <SectionShell icon={ChartBarIcon} title="Nutrition" subtitle="Food logs and meal totals are read from the mobile nutrition history." loading={loading}>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Meals logged" value={metrics.mealsLogged} />
        <Stat label="Nutrition days" value={metrics.nutritionDays} />
        <Stat label="Latest meal" value={recentLogs[0]?.mealName || 'No meals yet'} />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">Recent food logs</div>
        {recentLogs.length ? (
          <div className="divide-y divide-gray-200 bg-white">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{log.mealName || 'Meal'}</p>
                  <p className="text-sm text-gray-500">{log.localDate || formatDate(log.createdAt)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {Number(log.calories || 0)} cal | {Number(log.protein || 0)}g protein | {Number(log.carbs || 0)}g carbs | {Number(log.fat || 0)}g fat
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="bg-white px-4 py-6 text-sm text-gray-500">No meals have been logged yet.</p>
        )}
      </div>
    </SectionShell>
  );
}

function WorkoutsPanel({ dashboard, loading, onReload }) {
  const { user } = useAuth();
  const days = dashboard?.days || [];
  const events = dashboard?.calendarEvents || [];
  const initialDay = days.find((day) => day.date === toLocalDateString(new Date())) || days.find((day) => !day.isRestDay) || days[0] || null;
  const [selectedDayId, setSelectedDayId] = useState(initialDay?.id || null);
  const [planReview, setPlanReview] = useState(null);
  const [latestPlanReview, setLatestPlanReview] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    if (!selectedDayId && initialDay?.id) {
      setSelectedDayId(initialDay.id);
    }
  }, [initialDay?.id, selectedDayId]);

  const loadReviewStatus = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const reviews = await loadRecentPlanReviews(user.uid, 5);
      setLatestPlanReview(reviews[0] || null);
      const pending = reviews.find((review) => review.status === 'pending');
      if (pending) {
        setPlanReview(pending);
      }
    } catch (err) {
      console.warn('Plan review status load failed:', err);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadReviewStatus();
  }, [loadReviewStatus]);

  const selectedDay = days.find((day) => day.id === selectedDayId) || initialDay;
  const selectedDate = selectedDay?.date ? parseLocalDate(selectedDay.date) : new Date();

  const selectDayForDate = (date) => {
    const localDate = toLocalDateString(date);
    const match = days.find((day) => day.date === localDate);
    if (match) setSelectedDayId(match.id);
  };

  const eventTemplate = (props) => (
    <div className="sageset-calendar-event" title={props.Subject}>
      <span>{props.StatusLabel}</span>
      <strong>{props.Subject}</strong>
    </div>
  );

  const handleRequestReview = async () => {
    setReviewBusy(true);
    setReviewError('');
    setReviewMessage('');
    try {
      const result = await requestPlanReview();
      setPlanReview(result.review || null);
      if (result.review) {
        setLatestPlanReview(result.review);
      } else {
        await loadReviewStatus();
      }
      setReviewMessage(result.created ? 'Plan review created.' : result.reason || 'No pending review right now.');
    } catch (err) {
      setReviewError(err?.message || 'Unable to create a plan review.');
    } finally {
      setReviewBusy(false);
    }
  };

  const handleAcceptReview = async () => {
    if (!planReview?.id) return;
    setReviewBusy(true);
    setReviewError('');
    setReviewMessage('');
    try {
      const result = await acceptPlanReview(planReview.id);
      setReviewMessage(`Plan review accepted. ${Number(result.appliedChangeCount || 0)} change(s) applied.`);
      setPlanReview(null);
      await loadReviewStatus();
      await onReload?.();
    } catch (err) {
      setReviewError(err?.message || 'Unable to accept this plan review.');
    } finally {
      setReviewBusy(false);
    }
  };

  const handleDismissReview = async () => {
    if (!planReview?.id) return;
    setReviewBusy(true);
    setReviewError('');
    setReviewMessage('');
    try {
      await dismissPlanReview(planReview.id);
      setPlanReview(null);
      await loadReviewStatus();
      setReviewMessage('Plan review skipped.');
    } catch (err) {
      setReviewError(err?.message || 'Unable to skip this plan review.');
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <SectionShell icon={CalendarDaysIcon} title="Workouts" subtitle="View, print, or share your current workout plan from the web." loading={loading}>
      {days.length ? (
        <div className="space-y-6">
          <PlanReviewPanel
            review={planReview}
            latestReview={latestPlanReview}
            busy={reviewBusy}
            error={reviewError}
            message={reviewMessage}
            onRequest={handleRequestReview}
            onAccept={handleAcceptReview}
            onDismiss={handleDismissReview}
          />
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <ScheduleComponent
                width="100%"
                height="620px"
                selectedDate={selectedDate}
                currentView="Month"
                views={['Month', 'Week', 'Day', 'Agenda']}
                readonly
                eventSettings={{
                  dataSource: events,
                  fields: {
                    id: 'Id',
                    subject: 'Subject',
                    startTime: 'StartTime',
                    endTime: 'EndTime',
                    isAllDay: 'IsAllDay',
                  },
                  template: eventTemplate,
                }}
                eventRendered={(args) => {
                  args.element.style.backgroundColor = args.data.CategoryColor;
                  args.element.style.borderColor = args.data.CategoryColor;
                }}
                eventClick={(args) => {
                  if (args.event?.DayId) setSelectedDayId(args.event.DayId);
                }}
                cellClick={(args) => selectDayForDate(args.startTime)}
                popupOpen={(args) => {
                  args.cancel = true;
                }}
              >
                <ViewsDirective>
                  <ViewDirective option="Month" />
                  <ViewDirective option="Week" />
                  <ViewDirective option="Day" />
                  <ViewDirective option="Agenda" />
                </ViewsDirective>
                <Inject services={[Month, Week, Day, Agenda]} />
              </ScheduleComponent>
            </div>
            <WorkoutDetail day={selectedDay} />
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-600">
          No workout plan data is available yet. Create a plan in the mobile app and it will appear here.
        </p>
      )}
    </SectionShell>
  );
}

function PlanReviewPanel({ review, latestReview, busy, error, message, onRequest, onAccept, onDismiss }) {
  const changes = Array.isArray(review?.proposedChanges) ? review.proposedChanges : [];
  const actionableChanges = changes.filter((change) => change.scope !== 'plan' && change.type !== 'hold_steady');

  return (
    <div className="rounded-xl border border-sage-200 bg-sage-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sage-700">Plan review</p>
          <h3 className="mt-1 text-xl font-bold text-gray-900">SageSet can review your recent performance.</h3>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Recommended changes are shown before anything is applied. Approvals only update future incomplete workouts.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequest}
          disabled={busy}
          className="rounded-lg bg-sage-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-800 disabled:opacity-60"
        >
          {busy ? 'Working...' : review ? 'Refresh review' : 'Review plan'}
        </button>
      </div>

      {message ? <p className="mt-4 rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm font-semibold text-sage-800">{message}</p> : null}
      {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}

      {!review && latestReview ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700">
          <span className="font-bold text-gray-900">Latest review:</span>{' '}
          {formatReviewStatus(latestReview.status)}{latestReview.weekStart ? ` for week of ${latestReview.weekStart}` : ''}.
          {latestReview.status === 'accepted' ? ' No pending changes are waiting for approval.' : null}
        </div>
      ) : null}

      {review ? (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {formatRecommendationType(review.recommendationType)} | {review.weekStart || 'week'} to {review.weekEnd || 'now'}
              </p>
              <p className="mt-2 text-base font-semibold text-gray-900">{review.summary || 'Plan review is ready.'}</p>
            </div>
            <StatusPill complete={false} rest={false} />
          </div>

          {Array.isArray(review.rationale) && review.rationale.length ? (
            <ul className="mt-4 space-y-1 text-sm text-gray-600">
              {review.rationale.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 space-y-2">
            {changes.length ? (
              changes.map((change) => <ProposedChangeRow key={change.changeId || `${change.type}-${change.exerciseId}`} change={change} />)
            ) : (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">No workout changes are recommended right now.</p>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onAccept}
              disabled={busy}
              className="rounded-lg bg-sage-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-800 disabled:opacity-60"
            >
              {actionableChanges.length ? 'Approve changes' : 'Accept review'}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={busy}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-sage-600 hover:text-sage-700 disabled:opacity-60"
            >
              Skip
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProposedChangeRow({ change }) {
  const before = formatChangeValue(change.before);
  const after = formatChangeValue(change.after);
  const isPlanLevel = change.scope === 'plan' || change.type === 'hold_steady';

  return (
    <div className="rounded-lg bg-gray-50 px-3 py-3 text-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-gray-900">
          {isPlanLevel ? 'Plan recommendation' : `${change.exerciseName || 'Exercise'}${change.workoutName ? ` | ${change.workoutName}` : ''}`}
        </p>
        <p className="text-xs font-bold uppercase tracking-wide text-sage-700">{formatRecommendationType(change.type)}</p>
      </div>
      {!isPlanLevel ? (
        <p className="mt-1 text-gray-600">
          {before || 'Current target'} {'->'} {after || 'Updated target'}
        </p>
      ) : null}
      {change.reason ? <p className="mt-1 text-gray-500">{change.reason}</p> : null}
    </div>
  );
}

function WorkoutDetail({ day }) {
  if (!day) return null;

  const handlePrint = () => {
    const text = formatWorkoutShareText(day);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>SageSet Workout</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; padding: 32px; color: #111827; }
            pre { white-space: pre-wrap; font-size: 16px; line-height: 1.55; }
          </style>
        </head>
        <body><pre>${escapeHtml(text)}</pre></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleShare = async () => {
    const text = formatWorkoutShareText(day);
    if (navigator.share) {
      await navigator.share({ title: 'SageSet Workout', text });
      return;
    }
    await navigator.clipboard.writeText(text);
  };

  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sage-700">Selected day</p>
          <h3 className="mt-1 text-2xl font-bold text-gray-900">Day {day.order || '—'}</h3>
          <p className="text-sm text-gray-500">{day.date || 'No date'}</p>
        </div>
        <StatusPill complete={isDayComplete(day)} rest={day.isRestDay} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-sage-600 hover:text-sage-700">
          <PrinterIcon className="h-4 w-4" />
          Print
        </button>
        <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-sage-600 hover:text-sage-700">
          <ShareIcon className="h-4 w-4" />
          Share
        </button>
      </div>

      {day.isRestDay ? (
        <p className="mt-6 rounded-lg bg-gray-50 p-4 text-gray-600">Rest day. Keep the streak protected and recover well.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {(day.workouts || []).map((workout) => (
            <div key={workout.id} className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-bold text-gray-900">{workout.name || 'Workout'}</h4>
              <p className="mt-1 text-sm text-gray-500">
                {Number(workout.completedExercises || 0)} of {Number(workout.totalExercises || workout.exercises?.length || 0)} exercises complete
              </p>
              <div className="mt-3 space-y-2">
                {(workout.exercises || []).map((exercise) => (
                  <ExerciseLogDisclosure key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function ExerciseLogDisclosure({ exercise }) {
  const [open, setOpen] = useState(false);
  const loggedSets = getLoggedSets(exercise);
  const planned = [exercise.sets ? `${exercise.sets} sets` : null, exercise.reps ? `${exercise.reps} reps` : null].filter(Boolean).join(' x ') || 'As planned';

  return (
    <div className="rounded-md bg-gray-50 text-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="font-semibold text-gray-800">{exercise.name || 'Exercise'}</span>
        <span className="flex items-center gap-2 text-right text-gray-500">
          {planned}
          <span className="text-xs font-bold text-sage-700">{open ? 'Hide' : 'Details'}</span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-gray-200 px-3 py-3">
          {loggedSets.length ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="grid grid-cols-3 bg-gray-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
              </div>
              {loggedSets.map((set) => (
                <div key={set.set} className="grid grid-cols-3 border-t border-gray-100 px-3 py-2 text-gray-700">
                  <span>{set.set}</span>
                  <span>{set.weight != null ? `${set.weight} lbs` : '-'}</span>
                  <span>{set.reps != null ? set.reps : '-'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              No logged weight/reps details are synced for this exercise yet. New mobile logs will appear here after the next app build.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SectionShell({ icon: Icon, title, subtitle, loading, children }) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Icon className="h-8 w-8 text-sage-700" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">{title}</h2>
          <p className="mt-2 max-w-3xl text-gray-600">{subtitle}</p>
        </div>
        {loading ? <span className="rounded-full bg-sage-50 px-3 py-1 text-sm font-semibold text-sage-800">Loading live data...</span> : null}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function CoachStat({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
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

function StatusPill({ complete, rest }) {
  const className = rest
    ? 'bg-slate-100 text-slate-700'
    : complete
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      <CheckCircleIcon className="h-4 w-4" />
      {rest ? 'Rest' : complete ? 'Complete' : 'Planned'}
    </span>
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

function isDayComplete(day) {
  if (!day) return false;
  if (day.isRestDay || day.completed || Number(day.completionPct || 0) >= 1) return true;
  const workouts = Array.isArray(day.workouts) ? day.workouts : [];
  return workouts.length > 0 && workouts.every((workout) => workout.completed || Number(workout.completedExercises || 0) >= Number(workout.totalExercises || 1));
}

function parseLocalDate(value) {
  if (!value) return new Date();
  const [year, month, day] = String(value).split('-').map(Number);
  if (year && month && day) return new Date(year, month - 1, day);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toLocalDateString(value) {
  const date = value instanceof Date ? value : parseLocalDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getLoggedSets(exercise = {}) {
  const session = exercise.lastLoggedSession || {};
  if (Array.isArray(session.loggedSets) && session.loggedSets.length) {
    return session.loggedSets.map((item, index) => ({
      set: item.set || index + 1,
      weight: item.weight ?? null,
      reps: item.reps ?? null,
    }));
  }

  const weights = Array.isArray(session.weights) ? session.weights : Array.isArray(exercise.weights) ? exercise.weights : [];
  const reps = Array.isArray(session.repsAchieved) ? session.repsAchieved : Array.isArray(exercise.repsAchieved) ? exercise.repsAchieved : [];
  const count = Math.max(weights.length, reps.length, Number(exercise.completedSets || 0));

  return Array.from({ length: count }, (_unused, index) => ({
    set: index + 1,
    weight: weights[index] ?? null,
    reps: reps[index] ?? null,
  })).filter((item) => item.weight != null || item.reps != null);
}

function formatRecommendationType(value) {
  const labels = {
    progress_up: 'Progress up',
    hold_steady: 'Hold steady',
    simplify: 'Simplify',
    recovery_week: 'Recovery week',
    increase_reps: 'Increase reps',
    decrease_reps: 'Decrease reps',
    increase_sets: 'Increase sets',
    decrease_sets: 'Decrease sets',
    add_accessory_exercise: 'Add exercise',
    remove_accessory_exercise: 'Remove exercise',
  };
  return labels[value] || String(value || 'Review').replaceAll('_', ' ');
}

function formatReviewStatus(value) {
  const labels = {
    pending: 'pending approval',
    accepted: 'accepted',
    dismissed: 'skipped',
    expired: 'expired',
  };
  return labels[value] || String(value || 'not started');
}

function formatChangeValue(value = {}) {
  if (!value || typeof value !== 'object') return '';
  const parts = [];
  if (value.sets != null) parts.push(`${value.sets} sets`);
  if (value.reps != null) parts.push(`${value.reps} reps`);
  return parts.join(' x ');
}
