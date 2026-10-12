import { useState } from 'react';
import { getWorkoutFlexibilityForAdmin, updateWorkoutFlexibilityForAdmin } from '../services/adminUsers.js';

export default function WorkoutFlexibilityPanel() {
  const [policy, setPolicy] = useState({ enabled: false, rolloutPercent: 0 });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (save) => {
    setBusy(true); setError('');
    try {
      const response = save ? await updateWorkoutFlexibilityForAdmin({ enabled: policy.enabled, rolloutPercent: Number(policy.rolloutPercent) }) : await getWorkoutFlexibilityForAdmin();
      setPolicy(response.policy); setLoaded(true);
    } catch (failure) { setError(failure?.message || 'Workout flexibility is unavailable. Retry after deployment.'); }
    finally { setBusy(false); }
  };
  return (
    <section className="mt-6 rounded-2xl border border-gray-700 bg-gray-800/70 p-5" data-testid="workout-flexibility-policy">
      <h2 className="text-lg font-semibold text-white">Workout time pilot</h2>
      <p className="mt-2 text-sm text-gray-400">Independent master switch and stable account cohort for time-budgeted generation. Defaults off. Existing AI generation entitlements still apply. Mobile builds also need the workout flexibility capability enabled.</p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button disabled={busy} onClick={() => run(false)} className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-white disabled:opacity-50">Load policy</button>
        <label className="flex items-center gap-2 text-sm text-gray-200">
          <input type="checkbox" checked={policy.enabled} disabled={!loaded || busy} onChange={(event) => setPolicy((current) => ({ ...current, enabled: event.target.checked }))} /> Enabled
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-200">Rollout %
          <input type="number" min="0" max="100" step="1" disabled={!loaded || busy} value={policy.rolloutPercent}
            onChange={(event) => setPolicy((current) => ({ ...current, rolloutPercent: event.target.value }))}
            className="w-24 rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-white" />
        </label>
        <button disabled={!loaded || busy || !Number.isInteger(Number(policy.rolloutPercent)) || Number(policy.rolloutPercent) < 0 || Number(policy.rolloutPercent) > 100}
          onClick={() => run(true)} className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-white disabled:opacity-50">Save policy</button>
      </div>
      {loaded ? <p className="mt-3 text-xs text-gray-400">Policy {policy.version}. Disabling blocks new budgeted generation and preference writes; existing saved plans and histories remain.</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
