import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import AdminHeader from '../components/AdminHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { listSprintCoachFeedbackForAdmin } from '../services/adminUsers.js';

const formatDateTime = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const formatDifficulty = (value) => {
  const labels = {
    too_easy: 'Too easy',
    just_right: 'Just right',
    too_hard: 'Too hard',
  };
  return labels[value] || 'Not selected';
};

const formatDuration = (seconds) => {
  const value = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(value / 60);
  const remainder = Math.round(value % 60);
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
};

const sessionData = (item) => item?.session || item?.sessionSummary || {};
const sessionConfig = (item) => sessionData(item)?.config || sessionData(item) || {};
const timingData = (item) => sessionData(item)?.timingDiagnostics || {};

function AnswerBadge({ label, value }) {
  const colors =
    value === true
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      : value === false
        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
        : 'border-gray-600 bg-gray-800 text-gray-400';
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${colors}`}>
      {label}: {value == null ? 'Not answered' : value ? 'Yes' : 'No'}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, tone = 'emerald' }) {
  const tones = {
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    rose: 'text-rose-300',
    blue: 'text-blue-300',
  };
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className={`text-3xl font-bold ${tones[tone]}`}>{value}</div>
          <div className="mt-1 text-sm text-gray-400">{label}</div>
        </div>
        <Icon className={`h-7 w-7 ${tones[tone]}`} />
      </div>
    </div>
  );
}

export default function AdminSprintFeedbackPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [concern, setConcern] = useState('all');

  const loadFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listSprintCoachFeedbackForAdmin(100);
      setFeedback(Array.isArray(result?.feedback) ? result.feedback : []);
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load Sprint Coach feedback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedback();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return feedback.filter((item) => {
      if (difficulty !== 'all' && item.difficulty !== difficulty) return false;
      if (
        concern === 'timing' &&
        item.timerAccurate !== false &&
        item.countdownsClear !== false &&
        item.promptsTimedCorrectly !== false
      ) return false;
      if (concern === 'positive' && item.wouldUseAgain !== true) return false;
      if (!term) return true;
      return [
        item.userDisplayName,
        item.userEmail,
        item.uid,
        item.sessionId,
        item.comments,
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [concern, difficulty, feedback, search]);

  const stats = useMemo(() => {
    const ratings = feedback.map((item) => Number(item.rating)).filter(Number.isFinite);
    return {
      total: feedback.length,
      average: ratings.length
        ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)
        : '—',
      timingConcerns: feedback.filter(
        (item) =>
          item.timerAccurate === false ||
          item.countdownsClear === false ||
          item.promptsTimedCorrectly === false
      ).length,
      wouldUseAgain: feedback.filter((item) => item.wouldUseAgain === true).length,
    };
  }, [feedback]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AdminHeader userEmail={user?.email} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Sprint Coach
            </p>
            <h2 className="mt-2 text-3xl font-bold">Tester feedback</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              Review ratings, written comments, session context, and countdown timing diagnostics.
              New submissions also send a best-effort notification to support@worksidesoftware.com.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadFeedback()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:bg-gray-700 disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Reviews" value={stats.total} icon={ChatBubbleLeftRightIcon} />
          <StatCard label="Average rating" value={stats.average} icon={StarIcon} tone="amber" />
          <StatCard label="Timing concerns" value={stats.timingConcerns} icon={ClockIcon} tone="rose" />
          <StatCard label="Would use again" value={stats.wouldUseAgain} icon={ArrowPathIcon} tone="blue" />
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-gray-700 bg-gray-800 p-4 md:grid-cols-[1fr_auto_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tester, email, session, or comment"
            className="min-w-0 rounded-xl border border-gray-600 bg-gray-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-emerald-500"
          />
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="rounded-xl border border-gray-600 bg-gray-950 px-4 py-2.5 text-sm text-white"
          >
            <option value="all">All difficulty</option>
            <option value="too_easy">Too easy</option>
            <option value="just_right">Just right</option>
            <option value="too_hard">Too hard</option>
          </select>
          <select
            value={concern}
            onChange={(event) => setConcern(event.target.value)}
            className="rounded-xl border border-gray-600 bg-gray-950 px-4 py-2.5 text-sm text-white"
          >
            <option value="all">All responses</option>
            <option value="timing">Timing concerns</option>
            <option value="positive">Would use again</option>
          </select>
        </div>

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 p-12 text-center text-gray-400">
            Loading Sprint Coach feedback…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 p-12 text-center text-gray-400">
            No Sprint Coach feedback matches these filters.
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((item) => {
              const session = sessionData(item);
              const config = sessionConfig(item);
              const timing = timingData(item);
              const hasTiming = Number(timing.countdownCueSamples || 0) > 0;
              return (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-800">
                  <div className="border-b border-gray-700 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xl font-bold">
                            {item.userDisplayName || item.userEmail || 'Unknown tester'}
                          </span>
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-300">
                            ★ {item.rating || '—'}/5
                          </span>
                          <span className="rounded-full bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-200">
                            {formatDifficulty(item.difficulty)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-400">
                          {item.userEmail || item.uid} · {formatDateTime(item.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <EnvelopeIcon className="h-4 w-4" />
                        Support email: {item.supportEmail?.status || 'Not sent for legacy review'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 p-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Comments</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-100">
                        {item.comments || 'No written comments were provided.'}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <AnswerBadge label="Countdown clear" value={item.countdownsClear} />
                        <AnswerBadge label="Voice timing" value={item.promptsTimedCorrectly} />
                        <AnswerBadge label="Felt safe" value={item.feltSafe} />
                        <AnswerBadge label="Timer accurate" value={item.timerAccurate} />
                        <AnswerBadge label="Use again" value={item.wouldUseAgain} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Session</p>
                      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                        <div>
                          <dt className="text-gray-500">Mode</dt>
                          <dd className="mt-1 font-semibold capitalize">{config.mode || 'Unknown'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Level</dt>
                          <dd className="mt-1 font-semibold capitalize">{config.presetId || 'Unknown'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Rounds</dt>
                          <dd className="mt-1 font-semibold">{session.completedRounds ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Duration</dt>
                          <dd className="mt-1 font-semibold">{formatDuration(session.actualDurationSeconds)}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 border-t border-gray-700 pt-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                          <ClockIcon className="h-4 w-4 text-emerald-400" />
                          Countdown diagnostics
                        </div>
                        {hasTiming ? (
                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg bg-gray-800 p-3">
                              <div className="text-gray-500">Average cue delay</div>
                              <div className="mt-1 text-lg font-bold text-white">
                                {timing.averageCountdownCueDelayMs || 0} ms
                              </div>
                            </div>
                            <div className="rounded-lg bg-gray-800 p-3">
                              <div className="text-gray-500">Maximum cue delay</div>
                              <div className="mt-1 text-lg font-bold text-white">
                                {timing.maxCountdownCueDelayMs || 0} ms
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs leading-5 text-gray-500">
                            Timing diagnostics were not included by this app version.
                          </p>
                        )}
                      </div>
                      <div className="mt-3 break-all text-xs text-gray-600">Session: {item.sessionId}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
