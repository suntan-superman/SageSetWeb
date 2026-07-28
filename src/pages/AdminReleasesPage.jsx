import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BellAlertIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import AdminHeader from '../components/AdminHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  listReleaseAnnouncements,
  previewReleaseAnnouncement,
  sendReleaseAnnouncement,
} from '../services/releaseAnnouncements.js';

const presets = {
  squat: {
    title: 'Camera-Tracked AR Squats Are Here',
    message:
      'Your iPhone can now count full squat repetitions while SageSet tracks your movement in real time.',
    details:
      'Open Challenges in the SageSet app, choose Smart Squats, and follow the setup guidance before beginning.',
    platform: 'iphone',
  },
  pushup: {
    title: 'Live Push-Up Counting Is Now Available',
    message:
      'SageSet can now count completed push-up repetitions from a side-on camera view.',
    details:
      'Open Challenges, choose Push-Ups, and follow the side-profile setup guidance.',
    platform: 'iphone',
  },
  smartReturn: {
    title: 'Welcome Back with Smart Return',
    message:
      'SageSet now helps you resume training after time away with a simple check-in and recommendations you control.',
    details:
      'Take a Break preserves your plan. When you return, SageSet can help you continue, ease back in, repeat, or rebuild.',
    platform: 'all',
  },
};

const channelOptions = [
  {
    id: 'email',
    label: 'Email',
    description: 'Send a branded release email through SendGrid.',
    icon: EnvelopeIcon,
  },
  {
    id: 'push',
    label: 'Push notification',
    description: 'Notify opted-in mobile users with a saved Expo push token.',
    icon: BellAlertIcon,
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Text verified, opted-in phone numbers through Twilio.',
    icon: ChatBubbleLeftRightIcon,
  },
];

const createReleaseId = () => {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `release-${Date.now()}-${suffix}`;
};

const formatDateTime = (value) => {
  if (!value) return 'Pending';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

export default function AdminReleasesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preset = presets[searchParams.get('feature')] || null;
  const [releaseId, setReleaseId] = useState(createReleaseId);
  const [form, setForm] = useState({
    title: preset?.title || '',
    message: preset?.message || '',
    details: preset?.details || '',
    ctaLabel: 'See what is new',
    ctaUrl: 'https://sagesetfitness.com/upcoming',
    platform: preset?.platform || 'all',
    audience: 'testers',
    channels: { email: true, push: true, sms: false },
  });
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const payload = useMemo(() => ({ ...form, releaseId }), [form, releaseId]);
  const selectedChannels = Object.entries(form.channels)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel);
  const unavailableChannels = selectedChannels.filter(
    (channel) => preview?.providers?.[channel] === false
  );

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const value = await listReleaseAnnouncements(20);
      setHistory(Array.isArray(value?.announcements) ? value.announcements : []);
    } catch (historyError) {
      console.warn('Unable to load release announcement history:', historyError);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setPreview(null);
    setConfirmation('');
    setResult(null);
  };

  const toggleChannel = (channel) => {
    setForm((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [channel]: !current.channels[channel],
      },
    }));
    setPreview(null);
    setConfirmation('');
    setResult(null);
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setError('');
    setResult(null);
    try {
      setPreview(await previewReleaseAnnouncement(payload));
    } catch (previewError) {
      setError(previewError?.message || 'Unable to preview this announcement.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSend = async () => {
    if (confirmation !== 'SEND' || !preview) return;
    if (
      !window.confirm(
        `Send “${form.title}” to ${preview.audience?.selectedUniqueUsers || 0} opted-in users? This cannot be recalled.`
      )
    ) {
      return;
    }

    setSending(true);
    setError('');
    setResult(null);
    try {
      const value = await sendReleaseAnnouncement({
        ...payload,
        confirmation,
      });
      setResult(value);
      setConfirmation('');
      setPreview(null);
      setReleaseId(createReleaseId());
      await loadHistory();
    } catch (sendError) {
      setError(sendError?.message || 'Unable to send this release announcement.');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader userEmail={user?.email} onLogout={handleLogout} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
              Product release communications
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">Release Announcements</h1>
            <p className="mt-2 max-w-3xl text-gray-300">
              Preview an opted-in audience, choose delivery channels, and announce a release without
              exposing unpublished features.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Nothing sends until you preview, type <strong>SEND</strong>, and confirm.
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
            <div className="flex items-center gap-3">
              <MegaphoneIcon className="h-7 w-7 text-emerald-300" />
              <div>
                <h2 className="text-xl font-semibold text-white">Announcement</h2>
                <p className="text-sm text-gray-400">Release ID: {releaseId}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <Field label="Title" help="Used as the email subject and notification title.">
                <input
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                  maxLength={100}
                  className="admin-input"
                  placeholder="Camera-Tracked AR Squats Are Here"
                />
              </Field>
              <Field label="Short message" help="Keep this concise; it becomes the push and SMS message.">
                <textarea
                  value={form.message}
                  onChange={(event) => updateForm('message', event.target.value)}
                  maxLength={320}
                  rows={3}
                  className="admin-input"
                  placeholder="Tell members what changed and why it matters."
                />
                <p className="mt-1 text-right text-xs text-gray-500">{form.message.length}/320</p>
              </Field>
              <Field label="Email details" help="Optional supporting detail included in email only.">
                <textarea
                  value={form.details}
                  onChange={(event) => updateForm('details', event.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="admin-input"
                  placeholder="Setup guidance, supported devices, or release notes."
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="CTA label">
                  <input
                    value={form.ctaLabel}
                    onChange={(event) => updateForm('ctaLabel', event.target.value)}
                    maxLength={50}
                    className="admin-input"
                  />
                </Field>
                <Field label="CTA URL">
                  <input
                    type="url"
                    value={form.ctaUrl}
                    onChange={(event) => updateForm('ctaUrl', event.target.value)}
                    className="admin-input"
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Platform">
                  <select
                    value={form.platform}
                    onChange={(event) => updateForm('platform', event.target.value)}
                    className="admin-input"
                  >
                    <option value="all">All supported platforms</option>
                    <option value="iphone">iPhone</option>
                    <option value="android">Android</option>
                  </select>
                </Field>
                <Field label="Audience">
                  <select
                    value={form.audience}
                    onChange={(event) => updateForm('audience', event.target.value)}
                    className="admin-input"
                  >
                    <option value="testers">Feature testers only</option>
                    <option value="all_opted_in">All product-update opt-ins</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
                Delivery channels
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {channelOptions.map((channel) => {
                  const Icon = channel.icon;
                  const enabled = form.channels[channel.id] === true;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => toggleChannel(channel.id)}
                      className={`rounded-xl border p-4 text-left transition ${
                        enabled
                          ? 'border-emerald-400 bg-emerald-500/10'
                          : 'border-gray-700 bg-gray-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Icon className={`h-6 w-6 ${enabled ? 'text-emerald-300' : 'text-gray-500'}`} />
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${
                            enabled ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {enabled ? 'Selected' : 'Off'}
                        </span>
                      </div>
                      <p className="mt-3 font-semibold text-white">{channel.label}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-400">{channel.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing || !form.title.trim() || !form.message.trim() || selectedChannels.length === 0}
              className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
            >
              {previewing ? 'Calculating audience…' : 'Preview recipients'}
            </button>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-7 w-7 text-blue-300" />
                <h2 className="text-xl font-semibold text-white">Audience Preview</h2>
              </div>

              {preview ? (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Metric label="Audience profiles" value={preview.audience?.audienceProfiles || 0} />
                    <Metric label="Product-update opt-ins" value={preview.audience?.productUpdateOptIns || 0} />
                    <Metric label="Email eligible" value={preview.audience?.eligible?.email || 0} />
                    <Metric label="Push eligible" value={preview.audience?.eligible?.push || 0} />
                    <Metric label="SMS eligible" value={preview.audience?.eligible?.sms || 0} />
                    <Metric label="Unique recipients" value={preview.audience?.selectedUniqueUsers || 0} />
                  </div>

                  <div className="mt-5 space-y-2">
                    {channelOptions
                      .filter((channel) => form.channels[channel.id])
                      .map((channel) => {
                        const available = preview.providers?.[channel.id] !== false;
                        return (
                          <div
                            key={channel.id}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                              available
                                ? 'bg-emerald-500/10 text-emerald-200'
                                : 'bg-red-500/10 text-red-200'
                            }`}
                          >
                            {available ? (
                              <CheckCircleIcon className="h-5 w-5" />
                            ) : (
                              <ExclamationTriangleIcon className="h-5 w-5" />
                            )}
                            {channel.label}: {available ? 'provider ready' : 'provider not configured'}
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <label className="text-sm font-semibold text-amber-100" htmlFor="send-confirmation">
                      Type SEND to authorize delivery
                    </label>
                    <input
                      id="send-confirmation"
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value.toUpperCase())}
                      className="admin-input mt-3"
                      placeholder="SEND"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={
                        sending ||
                        confirmation !== 'SEND' ||
                        unavailableChannels.length > 0 ||
                        Number(preview.audience?.selectedUniqueUsers || 0) === 0
                      }
                      className="mt-3 w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                    >
                      {sending ? 'Sending announcement…' : 'Send release announcement'}
                    </button>
                  </div>
                </>
              ) : (
                <p className="mt-5 text-sm leading-6 text-gray-400">
                  Complete the announcement and preview recipients. Only members who explicitly enabled
                  product updates and qualify for a selected channel will appear.
                </p>
              )}

              {error ? <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
              {result ? (
                <div className="mt-4 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  Announcement completed with status <strong>{result.status}</strong>. Email:{' '}
                  {result.delivery?.email?.sent || 0}, push: {result.delivery?.push?.sent || 0}, SMS:{' '}
                  {result.delivery?.sms?.sent || 0}.
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-gray-700 bg-gray-800/90 p-6">
              <h2 className="text-xl font-semibold text-white">Announcement History</h2>
              {historyLoading ? (
                <p className="mt-4 text-sm text-gray-400">Loading release history…</p>
              ) : history.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">No release announcements have been sent.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {history.map((item) => (
                    <article key={item.id} className="rounded-xl border border-gray-700 bg-gray-900/30 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-xs text-gray-500">{formatDateTime(item.createdAt)}</p>
                        </div>
                        <span className="rounded-full bg-gray-700 px-3 py-1 text-xs font-bold text-gray-200">
                          {String(item.status || 'unknown').replaceAll('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-400">{item.message}</p>
                      <p className="mt-3 text-xs text-gray-500">
                        Email {item.delivery?.email?.sent || 0} · Push {item.delivery?.push?.sent || 0} · SMS{' '}
                        {item.delivery?.sms?.sent || 0}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-200">{label}</span>
      {help ? <span className="ml-2 text-xs text-gray-500">{help}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{label}</p>
    </div>
  );
}
