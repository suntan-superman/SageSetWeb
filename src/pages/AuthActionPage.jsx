import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function AuthActionPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const params = useMemo(() => new URLSearchParams(window.location.search), []);

  useEffect(() => {
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode !== 'verifyEmail' || !oobCode) {
      setStatus('error');
      setMessage('This verification link is missing required information.');
      return;
    }

    let cancelled = false;

    const verifyEmail = async () => {
      try {
        await applyActionCode(auth, oobCode);
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
        if (!cancelled) {
          setStatus('success');
          setMessage('Your email has been verified.');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          setMessage(
            error?.code === 'auth/expired-action-code'
              ? 'This verification link has expired. Please request a new one.'
              : 'This verification link is invalid or has already been used.'
          );
        }
      }
    };

    verifyEmail();

    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <main className="min-h-[70vh] bg-gray-950 px-6 py-20 text-white">
      <section className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-gray-900 p-8 shadow-2xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-emerald-300">
          SageSet Account
        </p>
        <h1 className="text-3xl font-extrabold">
          {status === 'success' ? 'Email verified' : status === 'error' ? 'Verification issue' : 'Verifying email'}
        </h1>
        <p className="mt-4 text-lg text-gray-300">{message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/login?emailVerified=1"
            className="rounded-lg bg-emerald-600 px-5 py-3 text-center font-bold text-white hover:bg-emerald-500"
          >
            Continue to sign in
          </Link>
          {status === 'error' ? (
            <Link
              to="/verify-email"
              className="rounded-lg border border-white/15 px-5 py-3 text-center font-bold text-gray-100 hover:bg-white/10"
            >
              Request a new email
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
