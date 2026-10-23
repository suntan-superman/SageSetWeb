const PRODUCTION_SITE_HOSTS = new Set(['sagesetfitness.com', 'www.sagesetfitness.com']);

const required = (env, name) => {
  const value = String(env[name] || '').trim();
  if (!value) throw new Error(`[SageSet configuration] ${name} is required.`);
  return value;
};

const parseUrl = (value, name) => {
  try {
    return new URL(value);
  } catch {
    throw new Error(`[SageSet configuration] ${name} must be an absolute URL.`);
  }
};

const isFalse = (value) => String(value || '').trim().toLowerCase() === 'false';

export function resolveRuntimeEnvironment(env = {}, browserOrigin = '') {
  const productionProjectId = String(env.VITE_LEGACY_FIREBASE_PROJECT_ID || '').trim();
  const mode = String(env.MODE || '').trim().toLowerCase();
  const explicitEnvironment = String(env.VITE_APP_ENV || '').trim().toLowerCase();
  if (mode === 'staging' && explicitEnvironment !== 'staging') {
    throw new Error('[SageSet configuration] A staging build requires VITE_APP_ENV=staging.');
  }
  if (explicitEnvironment && !['development', 'staging', 'production', 'test'].includes(explicitEnvironment)) {
    throw new Error('[SageSet configuration] VITE_APP_ENV is invalid.');
  }
  const name = explicitEnvironment || (mode === 'production' ? 'production' : 'development');
  const isStaging = name === 'staging';

  if (!isStaging) {
    return {
      name,
      isStaging: false,
      notificationsEnabled: true,
      stagingSiteOrigin: null,
      stripeCheckoutHost: 'checkout.stripe.com',
      firebase: null,
      appCheckSiteKey: null,
      workside: null,
      meta: null,
    };
  }

  const projectId = required(env, 'VITE_FIREBASE_PROJECT_ID');
  if (productionProjectId && projectId === productionProjectId) {
    throw new Error('[SageSet configuration] Staging cannot use the production Firebase project.');
  }
  const authDomain = required(env, 'VITE_FIREBASE_AUTH_DOMAIN');
  const storageBucket = required(env, 'VITE_FIREBASE_STORAGE_BUCKET');
  if (!authDomain.toLowerCase().includes(projectId.toLowerCase()) ||
      !storageBucket.toLowerCase().includes(projectId.toLowerCase())) {
    throw new Error('[SageSet configuration] Firebase domains must belong to the staging project.');
  }

  const stagingSite = parseUrl(required(env, 'VITE_STAGING_SITE_ORIGIN'), 'VITE_STAGING_SITE_ORIGIN');
  if (stagingSite.protocol !== 'https:' || PRODUCTION_SITE_HOSTS.has(stagingSite.hostname.toLowerCase())) {
    throw new Error('[SageSet configuration] The staging site must be a non-production HTTPS origin.');
  }
  if (browserOrigin) {
    const actualOrigin = parseUrl(browserOrigin, 'browser origin');
    const local = ['localhost', '127.0.0.1', '::1'].includes(actualOrigin.hostname);
    if (!local && actualOrigin.origin !== stagingSite.origin) {
      throw new Error('[SageSet configuration] Browser origin does not match the approved staging site.');
    }
  }

  const worksideUrl = parseUrl(required(env, 'VITE_WORKSIDE_ANALYTICS_URL'), 'VITE_WORKSIDE_ANALYTICS_URL');
  if (worksideUrl.origin !== 'https://workside-analytics-staging.web.app' ||
      required(env, 'VITE_WORKSIDE_ANALYTICS_ENVIRONMENT') !== 'staging') {
    throw new Error('[SageSet configuration] Staging must use the approved Workside staging collector.');
  }
  if (!isFalse(required(env, 'VITE_OUTBOUND_NOTIFICATIONS_ENABLED'))) {
    throw new Error('[SageSet configuration] Outbound notifications must be disabled in staging.');
  }
  if (String(env.VITE_META_PIXEL_ID || '').trim() || String(env.VITE_META_CAPI_ENDPOINT || '').trim()) {
    throw new Error('[SageSet configuration] Meta delivery must be unconfigured in staging.');
  }
  if (!isFalse(required(env, 'VITE_REDDIT_TRACKING_ENABLED'))) {
    throw new Error('[SageSet configuration] Reddit tracking must be disabled in staging.');
  }

  return {
    name,
    isStaging: true,
    notificationsEnabled: false,
    stagingSiteOrigin: stagingSite.origin,
    stripeCheckoutHost: required(env, 'VITE_STRIPE_CHECKOUT_HOST').toLowerCase(),
    firebase: {
      apiKey: required(env, 'VITE_FIREBASE_API_KEY'),
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId: required(env, 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: required(env, 'VITE_FIREBASE_APP_ID'),
    },
    appCheckSiteKey: required(env, 'VITE_FIREBASE_APPCHECK_SITE_KEY'),
    workside: {endpoint: worksideUrl.origin, environment: 'staging'},
    meta: {pixelId: '', capiEndpoint: '', testEventCode: ''},
  };
}

const browserOrigin = typeof window === 'undefined' ? '' : window.location.origin;
export const runtimeEnvironment = resolveRuntimeEnvironment(import.meta.env || {}, browserOrigin);
