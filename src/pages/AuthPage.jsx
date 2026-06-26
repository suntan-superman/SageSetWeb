import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { trackEvent } from '../services/metaPixel';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage({ mode = 'login' }) {
  const isSignup = mode === 'signup';
  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
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
        await signup(form);
        trackEvent('CompleteRegistration', { method: 'email' });
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
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          {isSignup ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" value={form.firstName} onChange={updateField('firstName')} />
              <Field label="Last name" value={form.lastName} onChange={updateField('lastName')} />
            </div>
          ) : null}

          <div className="mt-4 space-y-4">
            <Field label="Email" type="email" value={form.email} onChange={updateField('email')} required />
            <PasswordField
              label="Password"
              value={form.password}
              onChange={updateField('password')}
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              required
            />
            {isSignup ? (
              <PasswordField
                label="Confirm password"
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((value) => !value)}
                required
              />
            ) : null}
          </div>

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

function Field({ label, type = 'text', value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-200">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-2 w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none ring-sage-400 focus:ring-2"
      />
    </label>
  );
}

function PasswordField({ label, value, onChange, visible, onToggle, required = false }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-200">{label}</span>
      <div className="relative mt-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
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
