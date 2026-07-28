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
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import AdminHeader from '../components/AdminHeader.jsx';
import {
  getUserAdminDetail,
  getUserAdminPlanDetail,
  getARChallengeRolloutForAdmin,
  listUsersForAdmin,
  sendUserExpoNotification,
  updateARChallengeRolloutForAdmin,
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
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone] || toneClasses.gray}`}>
      {children}
    </span>
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
  const [expandedPlans, setExpandedPlans] = useState({});
  const [planLoadingId, setPlanLoadingId] = useState('');
  const [planLoadErrors, setPlanLoadErrors] = useState({});
  const [notificationTitle, setNotificationTitle] = useState('SageSet');
  const [notificationBody, setNotificationBody] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [accessActionLoading, setAccessActionLoading] = useState('');
  const detailRequestRef = useRef(0);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const selectedSummary = useMemo(
    () => users.find((item) => item.uid === selectedUserId) || null,
    [selectedUserId, users]
  );

  const filteredUsers = useMemo(() => {
    const term = deferredSearchTerm.trim().toLowerCase();
    if (!term) return users;

    return users.filter((item) =>
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
  }, [deferredSearchTerm, users]);

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
        setActionMessage(`Notification sent to ${tokenCount || sentCount} saved device token(s).`);
        setNotificationBody('');
      }
    } catch (error) {
      console.warn('Failed to send admin push notification:', error);
      setActionError(error?.message || 'Failed to send notification.');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleAccessAction = async (action) => {
    if (!selectedUserId) return;
    setAccessActionLoading(action);
    setActionMessage('');
    setActionError('');

    try {
      const result = await updateUserAccessForAdmin({ uid: selectedUserId, action });
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
        recalculate: 'Entitlements recalculated.',
      };
      setActionMessage(`${actionLabels[action] || 'Access updated.'}${demoSuffix}`);
    } catch (error) {
      console.warn('Failed to update user access:', error);
      setActionError(error?.message || 'Failed to update user access.');
    } finally {
      setAccessActionLoading('');
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
                          <SectionHeading help="Per-user access to demo behavior and capabilities that are moving through a controlled rollout. Changes are reflected when the app opens, signs in, or returns to the foreground.">
                            Feature Access
                          </SectionHeading>
                          <div className="mt-3">
                            <DetailRow label="Demo Account" value={selectedDetail.rawUserData?.accountFlags?.demo ? 'Enabled' : 'Disabled'} help="Grants demo-account entitlement behavior. It is separate from AR and Smart Return testing." />
                            <DetailRow label="AR Squat Test" value={selectedDetail.rawUserData?.betaFlags?.arkitChallenges === true || selectedDetail.rawUserData?.featureFlags?.arkitChallengesEnabled === true ? 'Enrolled' : 'Not enrolled'} help="Allows this user to test AR squats while the AR master rollout is enabled." />
                            <DetailRow label="Push-up Test" value={selectedDetail.rawUserData?.betaFlags?.arkitPushups === true ? 'Enrolled' : 'Not enrolled'} help="Allows this user to test AR push-ups while the AR master rollout is enabled." />
                            <DetailRow label="Smart Return Check-in Test" value={selectedDetail.rawUserData?.betaFlags?.smartReturn === true ? 'Enrolled' : 'Not enrolled'} help="Enables the enhanced return check-in and recommendations after a break. Take a Break itself remains available even when this is disabled." />
                          </div>
                          <div className="mt-4 grid gap-3">
                            <AccessActionButton action="toggle_demo_account" label={selectedDetail.rawUserData?.accountFlags?.demo ? 'Disable demo account' : 'Enable demo account'} help="Toggles this user's demo-account entitlement." onAction={handleAccessAction} loadingAction={accessActionLoading} />
                            <AccessActionButton action="toggle_arkit_beta" label={selectedDetail.rawUserData?.betaFlags?.arkitChallenges === true || selectedDetail.rawUserData?.featureFlags?.arkitChallengesEnabled === true ? 'Remove AR squat access' : 'Grant AR squat access'} help="Toggles per-user AR squat access during controlled rollout. The global AR master switch must also be enabled." onAction={handleAccessAction} loadingAction={accessActionLoading} />
                            <AccessActionButton action="toggle_pushup_beta" label={selectedDetail.rawUserData?.betaFlags?.arkitPushups === true ? 'Remove push-up access' : 'Grant push-up access'} help="Toggles per-user AR push-up access during controlled rollout. The global AR master switch must also be enabled." onAction={handleAccessAction} loadingAction={accessActionLoading} />
                            <AccessActionButton action="toggle_smart_return_beta" label={selectedDetail.rawUserData?.betaFlags?.smartReturn === true ? 'Remove Smart Return access' : 'Grant Smart Return access'} help="Toggles only the Smart Return check-in and recommendations. It does not remove the Take a Break action." onAction={handleAccessAction} loadingAction={accessActionLoading} />
                          </div>
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

                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
                        <h3 className="text-lg font-semibold text-white">Account Details</h3>
                        <div className="mt-4">
                          <DetailRow label="UID" value={selectedDetail.profile?.uid} mono />
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
