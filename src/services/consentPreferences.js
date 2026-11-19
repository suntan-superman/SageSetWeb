export const CONSENT_STORAGE_KEY = 'sageset.consent.v2';
export const LEGACY_META_CONSENT_KEY = 'sageset.marketingConsent.v1';
export const CONSENT_CHANGED_EVENT = 'sageset:consent-changed';
export const CONSENT_VERSION = '2026-10-23-capi-only';

// These hooks intentionally remain inactive until jurisdiction, retention, and
// deletion policies have been approved. They make the eventual policy boundary
// explicit without silently selecting legal behavior in application code.
export const CONSENT_POLICY_HOOKS = Object.freeze({
  jurisdictionRulesEnabled: false,
  retentionPolicyEnabled: false,
  deletionPolicyEnabled: false,
});

const DECISIONS = new Set(['granted', 'denied', 'unknown']);

function safeParse(value) {
  try {
    const parsed = JSON.parse(value || '');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function storageOrDefault(storage) {
  if (storage) return storage;
  try { return globalThis.window?.localStorage || null; } catch { return null; }
}

function navigatorOrDefault(navigatorValue) {
  return navigatorValue || globalThis.navigator || null;
}

function normalizedDecision(value) {
  return DECISIONS.has(value) ? value : 'unknown';
}

export function readConsentPreferences({ storage, navigator: navigatorValue } = {}) {
  const resolvedStorage = storageOrDefault(storage);
  const gpc = navigatorOrDefault(navigatorValue)?.globalPrivacyControl === true;
  let stored = null;
  try { stored = safeParse(resolvedStorage?.getItem(CONSENT_STORAGE_KEY)); } catch { stored = null; }

  let analytics = normalizedDecision(stored?.analytics);
  let advertising = normalizedDecision(stored?.advertising);

  // A legacy denial remains honored. A legacy grant is not promoted into the
  // new, separately-scoped consent contract and therefore stays unknown.
  if (!stored) {
    try {
      if (resolvedStorage?.getItem(LEGACY_META_CONSENT_KEY) === 'denied') advertising = 'denied';
    } catch {
      // Hardened/private storage is treated as an unknown decision.
    }
  }
  if (gpc) advertising = 'denied';

  return {
    analytics,
    advertising,
    gpc,
    version: typeof stored?.version === 'string' ? stored.version : CONSENT_VERSION,
    capturedAt: typeof stored?.capturedAt === 'string' ? stored.capturedAt : null,
  };
}

export function saveConsentPreferences(
  decisions,
  { storage, navigator: navigatorValue, now = () => new Date() } = {}
) {
  const resolvedStorage = storageOrDefault(storage);
  const gpc = navigatorOrDefault(navigatorValue)?.globalPrivacyControl === true;
  const preference = {
    analytics: normalizedDecision(decisions?.analytics),
    advertising: gpc ? 'denied' : normalizedDecision(decisions?.advertising),
    gpc,
    version: CONSENT_VERSION,
    capturedAt: now().toISOString(),
  };
  try {
    resolvedStorage?.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preference));
    resolvedStorage?.setItem(
      LEGACY_META_CONSENT_KEY,
      preference.advertising === 'granted' ? 'granted' : 'denied'
    );
  } catch {
    // The in-memory decision still applies to the current interaction.
  }
  globalThis.window?.dispatchEvent?.(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: preference }));
  return preference;
}

export const isAnalyticsAllowed = (preference = readConsentPreferences()) =>
  preference.analytics === 'granted';

export const isAdvertisingAllowed = (preference = readConsentPreferences()) =>
  preference.advertising === 'granted' && preference.gpc !== true;

