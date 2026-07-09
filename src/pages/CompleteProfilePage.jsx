import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { DevicePhoneMobileIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';

export default function CompleteProfilePage() {
  const { user, userData, completeProfileSetup, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    smsOptIn: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const existingName = userData?.displayName || user?.displayName || '';
    const existingPhone = userData?.contact?.phone || userData?.phone || '';
    setForm((current) => ({
      ...current,
      displayName: current.displayName || existingName,
      phone: current.phone || formatPhoneNumber(existingPhone),
      smsOptIn: current.smsOptIn || userData?.contact?.smsOptIn === true,
    }));
  }, [user?.displayName, userData]);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  if (isProfileSetupComplete(userData)) return <Navigate to="/dashboard" replace />;

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const updatePhone = (event) => {
    setForm((current) => ({ ...current, phone: formatPhoneNumber(event.target.value) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await completeProfileSetup({
        displayName: form.displayName,
        phone: normalizePhoneForSubmit(form.phone),
        smsOptIn: form.smsOptIn,
      });
      navigate('/verify-sms');
    } catch (err) {
      setError(err?.message || 'Unable to finish account setup.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-gray-950 px-6 py-12 text-white">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/10 p-7 shadow-2xl"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-sage-300">Almost ready</p>
        <h1 className="mt-3 text-3xl font-bold">Finish your SageSet setup</h1>
        <p className="mt-3 text-gray-300">
          Add the name SageSet should use and confirm your mobile number. After verification, download the
          SageSet mobile app to create your workout plan.
        </p>

        <div className="mt-7 space-y-5">
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-200">
              <UserCircleIcon className="h-5 w-5 text-sage-300" />
              Display name
            </span>
            <input
              type="text"
              value={form.displayName}
              onChange={updateField('displayName')}
              autoComplete="name"
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none ring-sage-400 focus:ring-2"
              placeholder="Mike Hunt"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-200">
              <DevicePhoneMobileIcon className="h-5 w-5 text-sage-300" />
              Mobile phone
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={updatePhone}
              autoComplete="tel"
              inputMode="tel"
              required
              maxLength={14}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none ring-sage-400 focus:ring-2"
              placeholder="(555) 555-5555"
            />
          </label>

          <label className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={form.smsOptIn}
              onChange={(event) => setForm((current) => ({ ...current, smsOptIn: event.target.checked }))}
              required
              className="mt-1 h-4 w-4 rounded border-gray-300 text-sage-600 focus:ring-sage-500"
            />
            <span>
              I agree to receive SageSet SMS messages for account confirmation, workout/account status,
              and service updates. Message and data rates may apply.
            </span>
          </label>
        </div>

        <div className="mt-6 rounded-lg border border-sage-300/20 bg-sage-300/10 px-4 py-3 text-sm text-sage-100">
          Next: verify the 6-digit SMS code, then open the mobile app to build your workout plan.
        </div>

        {error ? <p className="mt-5 rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-100">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-sage-500 px-5 py-3 font-semibold text-white hover:bg-sage-600 disabled:opacity-60"
          >
            {busy ? 'Sending SMS code...' : 'Continue to SMS verification'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-white/20 px-5 py-3 font-semibold text-white hover:border-sage-300"
          >
            Sign out
          </button>
        </div>
      </form>
    </section>
  );
}

function isProfileSetupComplete(userData) {
  const contact = userData?.contact || {};
  return Boolean((userData?.displayName || userData?.firstName) && (contact.phone || userData?.phone) && contact.smsOptIn === true);
}

function getPhoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits.slice(0, 10);
}

function formatPhoneNumber(value) {
  const digits = getPhoneDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function normalizePhoneForSubmit(value) {
  const digits = getPhoneDigits(value);
  return digits.length === 10 ? `+1${digits}` : value.trim();
}
