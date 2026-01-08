import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ExclamationTriangleIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      if (err.message.includes('Admin privileges')) {
        setError('Access denied. Admin privileges required.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-emerald-400 mb-2">SageSet</h1>
          <h2 className="text-xl text-gray-300">Admin Portal</h2>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
          {showResetForm ? (
            // Password Reset Form
            <>
              <h3 className="text-lg font-semibold text-white mb-6">Reset Password</h3>
              
              {resetSent ? (
                <div className="bg-emerald-900/50 border border-emerald-500 rounded-lg p-4 text-emerald-300">
                  <p>Password reset email sent! Check your inbox.</p>
                  <button
                    onClick={() => {
                      setShowResetForm(false);
                      setResetSent(false);
                    }}
                    className="mt-4 text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Back to login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label htmlFor="reset-email" className="sr-only">Email address</label>
                    <div className="relative">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Admin email address"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
                      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                  >
                    {loading && <ArrowPathIcon className="h-5 w-5 animate-spin" />}
                    {loading ? 'Sending...' : 'Send Reset Email'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowResetForm(false)}
                    className="w-full text-gray-400 hover:text-gray-300"
                  >
                    Back to login
                  </button>
                </form>
              )}
            </>
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <div className="relative">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Admin email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Password"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
                  <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {loading && <ArrowPathIcon className="h-5 w-5 animate-spin" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="w-full text-gray-400 hover:text-gray-300 text-sm"
              >
                Forgot password?
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm">
          This portal is for authorized administrators only.
        </p>
      </div>
    </div>
  );
}
