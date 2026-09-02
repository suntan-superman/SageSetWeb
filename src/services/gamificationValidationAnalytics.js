import { trackWorksideEvent } from './worksideAnalytics.js';

export const GAMIFICATION_VALIDATION_VERSION = 'phase1-v0';

export const GAMIFICATION_VALIDATION_EVENTS = Object.freeze([
  'onboarding_started',
  'onboarding_question_completed',
  'onboarding_completed',
  'starting_rank_viewed',
  'starting_point_cta_clicked',
  'first_workout_started',
  'first_workout_completed',
  'sagescore_changed',
  'xp_awarded',
  'rank_changed',
  'achievement_unlocked',
  'challenge_viewed',
  'challenge_started',
  'challenge_completed',
  'challenge_shared',
  'friend_challenge_created',
  'friend_challenge_opened',
  'friend_challenge_app_handoff_clicked',
  'friend_challenge_install_clicked',
  'concept_page_viewed',
  'concept_cta_clicked',
  'concept_preference_submitted',
  'concept_waitlist_intent',
]);

const ALLOWED_EVENTS = new Set(GAMIFICATION_VALIDATION_EVENTS);
const MAX_PROPERTY_STRING_LENGTH = 160;

const sanitizeValue = (value) => {
  if (typeof value === 'string') return value.slice(0, MAX_PROPERTY_STRING_LENGTH);
  if (typeof value === 'number' || typeof value === 'boolean' || value == null) return value;
  if (Array.isArray(value)) return value.slice(0, 10).map(sanitizeValue);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).slice(0, 20).map(([key, nestedValue]) => [key.slice(0, 80), sanitizeValue(nestedValue)])
    );
  }
  return String(value).slice(0, MAX_PROPERTY_STRING_LENGTH);
};

export function trackGamificationValidationEvent(eventName, properties = {}, options = {}) {
  if (!ALLOWED_EVENTS.has(eventName)) {
    return Promise.resolve({ suppressed: true, reason: 'unsupported_gamification_event' });
  }

  return trackWorksideEvent(
    eventName,
    {
      validationVersion: GAMIFICATION_VALIDATION_VERSION,
      ...sanitizeValue(properties),
    },
    options
  );
}
