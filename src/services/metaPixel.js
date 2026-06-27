const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';
const PIXEL_DEBUG_KEY = '__SAGESET_META_PIXEL_EVENTS__';

let initialized = false;
let lastPageViewPath = '';

export function isMetaPixelEnabled() {
  return Boolean(PIXEL_ID);
}

export function initMetaPixel() {
  if (!PIXEL_ID || initialized || typeof window === 'undefined') return;

  /* eslint-disable */
  !(function(f,b,e,v,n,t,s){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  })(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
  recordPixelDebugEvent('init', PIXEL_ID);
  initialized = true;
}

export function trackPageView() {
  if (!PIXEL_ID || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (currentPath === lastPageViewPath) return;
  lastPageViewPath = currentPath;
  const parameters = getPixelEventParameters({});
  const eventOptions = getPixelEventOptions();
  window.fbq('track', 'PageView', parameters, eventOptions);
  recordPixelDebugEvent('track', 'PageView', parameters, eventOptions);
}

export function trackEvent(name, parameters = {}) {
  if (!PIXEL_ID || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const eventParameters = getPixelEventParameters(parameters);
  const eventOptions = getPixelEventOptions();
  window.fbq('track', name, eventParameters, eventOptions);
  recordPixelDebugEvent('track', name, eventParameters, eventOptions);
}

export function trackCustomEvent(name, parameters = {}) {
  if (!PIXEL_ID || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const eventParameters = getPixelEventParameters(parameters);
  const eventOptions = getPixelEventOptions();
  window.fbq('trackCustom', name, eventParameters, eventOptions);
  recordPixelDebugEvent('trackCustom', name, eventParameters, eventOptions);
}

function getPixelEventParameters(parameters = {}) {
  if (typeof window === 'undefined') return parameters;
  const testEventCode = new URLSearchParams(window.location.search).get('test_event_code');
  return testEventCode ? { ...parameters, test_event_code: testEventCode } : parameters;
}

function getPixelEventOptions() {
  if (typeof window === 'undefined') return undefined;
  const testEventCode = new URLSearchParams(window.location.search).get('test_event_code');
  return testEventCode ? { test_event_code: testEventCode } : undefined;
}

function recordPixelDebugEvent(kind, name, parameters = {}, options = undefined) {
  if (typeof window === 'undefined') return;
  window[PIXEL_DEBUG_KEY] = window[PIXEL_DEBUG_KEY] || [];
  window[PIXEL_DEBUG_KEY].push({
    kind,
    name,
    parameters,
    options,
    timestamp: new Date().toISOString(),
  });
  window[PIXEL_DEBUG_KEY] = window[PIXEL_DEBUG_KEY].slice(-50);
}
