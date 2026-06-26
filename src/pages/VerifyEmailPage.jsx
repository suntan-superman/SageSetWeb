import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';

export default function VerifyEmailPage() {
  const { user, logout, refreshAuthUser, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!user) return <Navigate to="/login" replace />;
  if (user.emailVerified) return <Navigate to="/dashboard" replace />;

  const handleCheck = async () => {
    setBusy('check');
    setError('');
    setMessage('');
    try {
      const refreshed = await refreshAuthUser();
      if (refreshed?.emailVerified) {
        navigate('/dashboard');
      } else {
        setMessage('Email is not verified yet. Please check your inbox and spam folder.');
      }
    } catch (err) {
      setError(err?.message || 'Unable to check verification status.');
    } finally {
      setBusy('');
    }
  };

  const handleResend = async () => {
    setBusy('resend');
    setError('');
    setMessage('');
    try {
      await resendVerificationEmail();
      setMessage('Verification email sent.');
    } catch (err) {
      setError(err?.message || 'Unable to resend verification email.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="bg-gray-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl">
        <EnvelopeIcon className="h-10 w-10 text-sage-300" />
        <h1 className="mt-5 text-3xl font-bold">Confirm your email</h1>
        <p className="mt-4 text-gray-300">
          We sent a verification email to <span className="font-semibold text-white">{user.email}</span>.
          Confirm your email before opening the SageSet dashboard.
        </p>

        {message ? <p className="mt-5 rounded-lg bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}
        {error ? <p className="mt-5 rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-100">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCheck}
            disabled={!!busy}
            className="rounded-lg bg-sage-500 px-5 py-3 font-semibold text-white hover:bg-sage-600 disabled:opacity-60"
          >
            {busy === 'check' ? 'Checking...' : 'I verified my email'}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={!!busy}
            className="rounded-lg border border-white/20 px-5 py-3 font-semibold text-white hover:border-sage-300 disabled:opacity-60"
          >
            {busy === 'resend' ? 'Sending...' : 'Resend email'}
          </button>
        </div>

        <button type="button" onClick={logout} className="mt-6 text-sm text-gray-300 hover:text-white">
          Sign out
        </button>
      </div>
    </section>
  );
}
