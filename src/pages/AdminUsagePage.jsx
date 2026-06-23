import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import AdminHeader from '../components/AdminHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { listNutritionUsageForAdmin } from '../services/adminUsers.js';

const bandClass = {
  normal: 'bg-emerald-900/30 text-emerald-300 border-emerald-700',
  heavy: 'bg-amber-900/30 text-amber-300 border-amber-700',
  suspicious: 'bg-orange-900/30 text-orange-300 border-orange-700',
  likely_abuse: 'bg-red-900/30 text-red-300 border-red-700',
};

export default function AdminUsagePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState([]);
  const [meta, setMeta] = useState({ todayKey: '', monthKey: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsage = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listNutritionUsageForAdmin(150);
      setUsage(result.users || []);
      setMeta({ todayKey: result.todayKey || '', monthKey: result.monthKey || '' });
    } catch (err) {
      console.warn('Usage load failed:', err);
      setError(err?.message || 'Failed to load usage.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  const stats = useMemo(() => {
    return usage.reduce(
      (acc, item) => {
        acc.today += Number(item.analysesToday || 0);
        acc.month += Number(item.analysesThisMonth || 0);
        if (item.flaggedForReview) acc.flagged += 1;
        if (item.usageBand === 'heavy') acc.heavy += 1;
        if (item.usageBand === 'suspicious' || item.usageBand === 'likely_abuse') acc.suspicious += 1;
        return acc;
      },
      { today: 0, month: 0, flagged: 0, heavy: 0, suspicious: 0 }
    );
  }, [usage]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader userEmail={user?.email} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ChartBarIcon className="h-7 w-7 text-emerald-400" />
              AI Nutrition Usage
            </h2>
            <p className="text-gray-400 mt-1">
              Today {meta.todayKey || 'current'} • Month {meta.monthKey || 'current'}
            </p>
          </div>
          <button
            onClick={loadUsage}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white font-semibold transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Stat label="Analyses Today" value={stats.today} color="text-emerald-400" />
          <Stat label="Analyses Month" value={stats.month} color="text-blue-400" />
          <Stat label="Heavy Users" value={stats.heavy} color="text-amber-400" />
          <Stat label="Suspicious" value={stats.suspicious} color="text-orange-400" />
          <Stat label="Flagged" value={stats.flagged} color="text-red-400" />
        </div>

        {error ? (
          <div className="mb-6 flex items-center gap-2 text-red-300 bg-red-950/40 border border-red-800 rounded-xl p-4">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <h3 className="font-semibold text-white">Top Nutrition Usage Users</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-emerald-400">Loading usage...</div>
          ) : usage.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No nutrition usage recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/60">
                  <tr>
                    <Th>User</Th>
                    <Th>Today</Th>
                    <Th>Month</Th>
                    <Th>Avg / Active Day</Th>
                    <Th>Max Day</Th>
                    <Th>Band</Th>
                    <Th>Flag</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {usage.map((item) => (
                    <tr key={item.uid} className="hover:bg-gray-700/40">
                      <Td>
                        <div className="font-medium text-white">{item.displayName || 'Unknown user'}</div>
                        <div className="text-xs text-gray-400">{item.email || item.uid}</div>
                      </Td>
                      <Td>{item.analysesToday || 0}</Td>
                      <Td>{item.analysesThisMonth || 0}</Td>
                      <Td>{Number(item.avgAnalysesPerActiveDay || 0).toFixed(1)}</Td>
                      <Td>{item.maxAnalysesInOneDay || 0}</Td>
                      <Td>
                        <span className={`inline-flex px-2 py-1 rounded-full border text-xs font-semibold ${bandClass[item.usageBand] || bandClass.normal}`}>
                          {item.usageBand || 'normal'}
                        </span>
                      </Td>
                      <Td>
                        {item.flaggedForReview ? (
                          <span className="text-red-300 text-sm font-semibold">{item.flagReason || 'Review'}</span>
                        ) : (
                          <span className="text-gray-500 text-sm">None</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">{children}</th>;
}

function Td({ children }) {
  return <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{children}</td>;
}
