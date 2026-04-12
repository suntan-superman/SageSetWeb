import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  BellAlertIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentListIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import AdminHeader from '../components/AdminHeader.jsx';
import {
  getUserAdminDetail,
  listUsersForAdmin,
  sendUserExpoNotification,
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

const buildDefaultExpandedPlans = (detail) => {
  const plans = Array.isArray(detail?.plans) ? detail.plans : [];
  if (plans.length === 0) return {};

  return plans.reduce((acc, plan, index) => {
    if (plan.active || plans.length === 1 || index === 0) {
      acc[plan.id] = true;
    }
    return acc;
  }, {});
};

function StatCard({ icon: Icon, label, value, tone = 'emerald' }) {
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
          <div className="mt-1 text-sm text-gray-400">{label}</div>
        </div>
        <div className="rounded-xl bg-gray-900/60 p-3">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-700/70 py-3 last:border-b-0">
      <div className="text-sm text-gray-400">{label}</div>
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

function PlanPanel({ plan, expanded, onToggle }) {
  const stats = plan?.stats || {};
  const days = Array.isArray(plan?.days) ? plan.days : [];

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
            <StatusChip>{stats.dayCount || 0} days</StatusChip>
            <StatusChip>{stats.workoutCount || 0} workouts</StatusChip>
            <StatusChip>{stats.exerciseCount || 0} exercises</StatusChip>
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
          {days.length === 0 ? (
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
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [detailCache, setDetailCache] = useState({});
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPlans, setExpandedPlans] = useState({});
  const [notificationTitle, setNotificationTitle] = useState('SageSet');
  const [notificationBody, setNotificationBody] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
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

    setSelectedUserId(uid);
    setDetailError('');
    setActionMessage('');
    setActionError('');

    if (!force && detailCache[uid]) {
      setSelectedDetail(detailCache[uid]);
      setExpandedPlans(buildDefaultExpandedPlans(detailCache[uid]));
      return;
    }

    setSelectedDetail(null);
    setExpandedPlans({});
    setDetailLoading(true);

    try {
      const detail = await getUserAdminDetail(uid);
      setDetailCache((prev) => ({ ...prev, [uid]: detail }));
      setSelectedDetail(detail);
      setExpandedPlans(buildDefaultExpandedPlans(detail));
    } catch (error) {
      console.error('Failed to load user detail:', error);
      setDetailError(error?.message || 'Failed to load user detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const loadUsers = async ({ preserveSelection = true } = {}) => {
    setUsersLoading(true);
    setUsersError('');

    try {
      const result = await listUsersForAdmin(250);
      const nextUsers = Array.isArray(result?.users) ? result.users : [];
      setUsers(nextUsers);

      const preferredUserId =
        preserveSelection && nextUsers.some((item) => item.uid === selectedUserId)
          ? selectedUserId
          : nextUsers[0]?.uid || '';

      if (preferredUserId) {
        await selectUser(preferredUserId);
      } else {
        setSelectedUserId('');
        setSelectedDetail(null);
      }
    } catch (error) {
      console.error('Failed to load admin users:', error);
      setUsersError(error?.message || 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers({ preserveSelection: false });
  }, []);

  const togglePlan = (planId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
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
      console.error('Failed to send admin push notification:', error);
      setActionError(error?.message || 'Failed to send notification.');
    } finally {
      setSendingNotification(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader userEmail={user?.email} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={UsersIcon} label="Total Users" value={stats.total} tone="emerald" />
          <StatCard icon={ClipboardDocumentListIcon} label="Users With Plans" value={stats.withPlans} tone="blue" />
          <StatCard icon={DevicePhoneMobileIcon} label="Push Ready" value={stats.withPush} tone="amber" />
          <StatCard icon={UserCircleIcon} label="Verified Emails" value={stats.verified} tone="rose" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/90">
            <div className="border-b border-gray-700 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Users</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {filteredUsers.length} of {users.length} shown
                  </p>
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
                <div className="p-6 text-sm text-gray-400">Loading users...</div>
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
              <div className="rounded-2xl border border-gray-700 bg-gray-800/90 p-8 text-sm text-gray-300">
                Loading details for {formatUserLabel(selectedSummary)}...
              </div>
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
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <StatCard icon={ClipboardDocumentListIcon} label="Plans" value={selectedDetail.stats?.planCount || 0} tone="blue" />
                          <StatCard icon={ClipboardDocumentListIcon} label="Workout Days" value={selectedDetail.stats?.dayCount || 0} tone="emerald" />
                          <StatCard icon={ClipboardDocumentListIcon} label="Workouts" value={selectedDetail.stats?.workoutCount || 0} tone="amber" />
                          <StatCard icon={ClipboardDocumentListIcon} label="Exercises" value={selectedDetail.stats?.exerciseCount || 0} tone="rose" />
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
                          Review saved plans, daily structure, workouts, and exercises.
                        </p>
                      </div>

                      {Array.isArray(selectedDetail.plans) && selectedDetail.plans.length > 0 ? (
                        selectedDetail.plans.map((plan) => (
                          <PlanPanel
                            key={plan.id}
                            plan={plan}
                            expanded={!!expandedPlans[plan.id]}
                            onToggle={() => togglePlan(plan.id)}
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
