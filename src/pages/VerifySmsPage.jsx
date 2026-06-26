import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';

export default function VerifySmsPage() {
  const { user, userData, logout, resendSmsVerification, verifySmsCode } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const contact = userData?.contact || {};
  const phone = contact.phone || userData?.phone || '';
  const requiresSmsVerification = contact.smsOptIn === true && contact.smsVerificationStatus !== 'verified';

  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  if (!requiresSmsVerification) return <Navigate to="/dashboard" replace />;

  const handleVerify = async (event) => {
    event.preventDefault();
    setBusy('verify');
    setError('');
    setMessage('');
    try {
      await verifySmsCode(code);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Unable to verify the SMS code.');
    } finally {
      setBusy('');
    }
  };

  const handleResend = async () => {
    setBusy('resend');
    setError('');
    setMessage('');
    try {
      await resendSmsVerification();
      setMessage('A new SMS confirmation code was sent.');
    } catch (err) {
      setError(err?.message || 'Unable to resend the SMS code.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="bg-gray-950 px-6 py-16 text-white">
      <form
        onSubmit={handleVerify}
        className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl"
      >
        <DevicePhoneMobileIcon className="h-10 w-10 text-sage-300" />
        <h1 className="mt-5 text-3xl font-bold">Confirm your phone</h1>
        <p className="mt-4 text-gray-300">
          Enter the 6-digit code we sent to <span className="font-semibold text-white">{phone}</span>.
          SageSet app access stays locked until this mobile number is verified.
        </p>

        <label className="mt-6 block text-sm font-semibold text-gray-200" htmlFor="sms-code">
          SMS confirmation code
        </label>
        <input
          id="sms-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] text-gray-900 outline-none ring-sage-400 focus:ring-2"
          required
        />

        {message ? <p className="mt-5 rounded-lg bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}
        {error ? <p className="mt-5 rounded-lg bg-red-500/20 px-4 py-3 text-sm text-red-100">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={!!busy || code.length !== 6}
            className="rounded-lg bg-sage-500 px-5 py-3 font-semibold text-white hover:bg-sage-600 disabled:opacity-60"
          >
            {busy === 'verify' ? 'Verifying...' : 'Verify phone'}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={!!busy}
            className="rounded-lg border border-white/20 px-5 py-3 font-semibold text-white hover:border-sage-300 disabled:opacity-60"
          >
            {busy === 'resend' ? 'Sending...' : 'Resend SMS'}
          </button>
        </div>

        <button type="button" onClick={logout} className="mt-6 text-sm text-gray-300 hover:text-white">
          Sign out
        </button>
      </form>
    </section>
  );
}
