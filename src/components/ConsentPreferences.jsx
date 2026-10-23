import { useEffect, useState } from 'react';
import {
  CONSENT_CHANGED_EVENT,
  readConsentPreferences,
  saveConsentPreferences,
} from '../services/consentPreferences.js';

export default function ConsentPreferences() {
  const [preference, setPreference] = useState(() => readConsentPreferences());
  const [open, setOpen] = useState(
    () => preference.analytics === 'unknown' || preference.advertising === 'unknown'
  );
  const [analytics, setAnalytics] = useState(preference.analytics === 'granted');
  const [advertising, setAdvertising] = useState(preference.advertising === 'granted');

  useEffect(() => {
    const update = (event) => setPreference(event.detail || readConsentPreferences());
    window.addEventListener(CONSENT_CHANGED_EVENT, update);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, update);
  }, []);

  const save = (next) => {
    const saved = saveConsentPreferences(next);
    setPreference(saved);
    setAnalytics(saved.analytics === 'granted');
    setAdvertising(saved.advertising === 'granted');
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-xl border border-sage-300 bg-white p-5 text-gray-900 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="privacy-choices-title">
          <h2 id="privacy-choices-title" className="text-lg font-semibold">Privacy choices</h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            Draft copy for legal review: choose whether SageSet may use analytics to improve the service and advertising technologies to measure campaigns. Essential account and security functions remain active.
          </p>
          {preference.gpc && (
            <p className="mt-2 rounded-md bg-sage-50 p-3 text-sm" role="status">
              Global Privacy Control is enabled, so advertising tracking is disabled.
            </p>
          )}
          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-3">
              <input className="mt-1 h-4 w-4" type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
              <span><strong>Analytics</strong><span className="block text-sm text-gray-600">Help us understand site and product usage.</span></span>
            </label>
            <label className="flex items-start gap-3">
              <input className="mt-1 h-4 w-4" type="checkbox" checked={advertising && !preference.gpc} disabled={preference.gpc} onChange={(event) => setAdvertising(event.target.checked)} />
              <span><strong>Advertising</strong><span className="block text-sm text-gray-600">Allow campaign measurement for Meta and any future advertising provider.</span></span>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="rounded-lg bg-sage-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => save({ analytics: analytics ? 'granted' : 'denied', advertising: advertising ? 'granted' : 'denied' })}>Save choices</button>
            <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold" onClick={() => save({ analytics: 'denied', advertising: 'denied' })}>Reject optional tracking</button>
          </div>
        </div>
      )}
      {!open && (
        <button type="button" className="fixed bottom-3 left-3 z-[90] rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow" onClick={() => setOpen(true)}>
          Review privacy choices
        </button>
      )}
    </>
  );
}
