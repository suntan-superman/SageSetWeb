import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { trackEvent } from '../services/metaPixel';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage({ mode = 'login' }) {
  const isSignup = mode === 'signup';
  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    smsOptIn: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSignup) {
      trackEvent('ViewContent', {
        content_name: 'SageSet signup',
        content_category: 'signup',
      });
    }
  }, [isSignup]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const updatePhone = (event) => {
    setForm((current) => ({ ...current, phone: formatPhoneNumber(event.target.value) }));
  };

  const updateChecked = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.checked }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      if (isSignup) {
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match.');
          setBusy(false);
          return;
        }
        if (getPhoneDigits(form.phone).length !== 10) {
          setError('Phone number is required.');
          setBusy(false);
          return;
        }
        if (!form.smsOptIn) {
          setError('Please opt in to SMS account and status updates to continue.');
          setBusy(false);
          return;
        }
        trackEvent('Lead', { content_name: 'web_signup_submit', content_category: 'signup' });
        await signup(form);
        trackEvent('CompleteRegistration', { method: 'email' });
        navigate('/verify-email');
        return;
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Unable to continue. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!form.email) {
      setError('Enter your email first.');
      return;
    }

    try {
      await resetPassword(form.email);
      setMessage('Password reset email sent.');
      setError('');
    } catch (err) {
      setError(err?.message || 'Unable to send reset email.');
    }
  };

  return (
    <section className="bg-gray-950 px-6 py-16 text-white">
      <div className="mx-auto grid max-w-content gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sage-300">
            {isSignup ? 'Start your trial' : 'Member portal'}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {isSignup ? 'Create your SageSet account.' : 'Welcome back to SageSet.'}
          </h1>
          <p className="mt-5 text-lg leading-8 text-gray-300">
            Manage your trial, subscription, workouts, nutrition, and progress from the web dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-sage-100">
            {isSignup ? (
              <>
                <Badge>14-Day Free Trial</Badge>
                <Badge>No credit card required</Badge>
                <Badge>Takes less than 60 seconds</Badge>
              </>
            ) : (
              <>
                <Badge>Secure Login</Badge>
                <Badge>Powered by Firebase Authentication</Badge>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          {isSignup ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" value={form.firstName} onChange={updateField('firstName')} autoComplete="given-name" />
              <Field label="Last name" value={form.lastName} onChange={updateField('lastName')} autoComplete="family-name" />
            </div>
          ) : null}

          <div className="mt-4 space-y-4">
            <Field label="Email" type="email" value={form.email} onChange={updateField('email')} autoComplete="email" required />
            {isSignup ? (
              <Field
                label="Mobile phone"
                type="tel"
                value={form.phone}
                onChange={updatePhone}
                autoComplete="tel"
                inputMode="tel"
                placeholder="(555) 555-5555"
                maxLength={14}
                required
              />
            ) : null}
            <PasswordField
              label="Password"
              value={form.password}
              onChange={updateField('password')}
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
            />
            {isSignup ? (
              <PasswordField
                label="Confirm password"
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((value) => !value)}
                autoComplete="new-password"
                required
              />
            ) : null}
          </div>

          {isSignup ? (
            <label className="mt-4 flex gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={form.smsOptIn}
                onChange={updateChecked('smsOptIn')}
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-sage-600 focus:ring-sage-500"
              />
              <span>
                I agree to receive SageSet SMS messages for account confirmation, trial reminders, subscription status, and service updates. Message and data rates may apply.
              </span>
            </label>
          ) : null}

          {isSignup ? (
            <div className="mt-4 rounded-lg border border-sage-300/20 bg-sage-300/10 px-4 py-3 text-sm text-sage-100">
              14-day free trial. No credit card required. Account setup takes less than 60 seconds.
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
              Secure login powered by Firebase Authentication.
            </div>
          )}

          {error ? <p className="mt-4 rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-100">{error}</p> : null}
          {message ? <p className="mt-4 rounded-lg bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-lg bg-sage-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-sage-600 disabled:opacity-60"
          >
            {busy ? 'Working...' : isSignup ? 'Create account' : 'Sign in'}
          </button>

          {!isSignup ? (
            <button type="button" onClick={handleReset} className="mt-4 w-full text-sm text-gray-300 hover:text-white">
              Forgot password?
            </button>
          ) : null}

          <p className="mt-6 text-center text-sm text-gray-300">
            {isSignup ? 'Already have an account?' : 'New to SageSet?'}{' '}
            <Link to={isSignup ? '/login' : '/signup'} className="font-semibold text-sage-300 hover:text-sage-200">
              {isSignup ? 'Sign in' : 'Start free trial'}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

function Badge({ children }) {
  return (
    <span className="rounded-full border border-sage-300/20 bg-sage-300/10 px-3 py-1">
      {children}
    </span>
  );
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

function Field({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-200">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-2 w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none ring-sage-400 focus:ring-2"
      />
    </label>
  );
}

function PasswordField({ label, value, onChange, visible, onToggle, required = false, autoComplete }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-200">{label}</span>
      <div className="relative mt-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-white/10 bg-white px-4 py-3 pr-12 text-gray-900 outline-none ring-sage-400 focus:ring-2"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    </label>
  );
}
