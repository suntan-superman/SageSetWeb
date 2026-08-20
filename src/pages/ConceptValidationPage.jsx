import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CheckBadgeIcon, FireIcon, ShieldCheckIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { trackWorksideEvent } from '../services/worksideAnalytics.js';

const CONCEPTS_ENABLED = import.meta.env.VITE_ENABLE_GAMIFICATION_CONCEPTS === 'true';

const PAGE_CONFIG = {
  '/concept/verified-challenges': {
    id: 'verified_challenges',
    eyebrow: 'Concept preview · SageSet Verified',
    title: 'Every verified rep moves you forward.',
    body: 'A future challenge loop designed around trustworthy progress—not unsafe volume. Start with yourself, then invite the people you trust.',
    icon: ShieldCheckIcon,
    cta: 'I would try a verified challenge',
    statLabel: '42 verified squats',
    statBody: 'New personal best · Candidate concept',
  },
  '/concept/sagescore': {
    id: 'sagescore',
    eyebrow: 'Concept preview · SageScore',
    title: 'See the quality of your progress.',
    body: 'A candidate score could combine adherence, consistency, improvement, verification, nutrition, and recovery—so raw volume never tells the whole story.',
    icon: SparklesIcon,
    cta: 'I want to understand my progress',
    statLabel: 'Silver · 54',
    statBody: '12 points to Gold · Candidate concept',
  },
  '/concept/achievements': {
    id: 'achievements',
    eyebrow: 'Concept preview · Milestones',
    title: 'Make your momentum visible.',
    body: 'Meaningful achievements can celebrate showing up, completing a program, setting a personal best, or reaching a verified milestone.',
    icon: TrophyIcon,
    cta: 'I would use progress achievements',
    statLabel: '75-Day Finisher',
    statBody: 'Program milestone · Candidate concept',
  },
  '/concept/onboarding': {
    id: 'progression_onboarding',
    eyebrow: 'Concept preview · Starting Point',
    title: 'Start with a plan that can grow with you.',
    body: 'Six meaningful questions can shape a more human beginning: your goal, level, schedule, location, equipment, and biggest obstacle.',
    icon: FireIcon,
    cta: 'I prefer this onboarding approach',
    statLabel: 'Starting Point · 56',
    statBody: 'Build a repeatable routine · Candidate concept',
  },
};

const preferenceOptions = [
  { id: 'me_vs_me', label: 'Me vs. Me', body: 'Private progress and personal bests.' },
  { id: 'friends_private', label: 'Friends / private groups', body: 'Motivation with people I choose.' },
  { id: 'community_later', label: 'Maybe later', body: 'I am not ready for competition yet.' },
];

export default function ConceptValidationPage({ path = '/concept/verified-challenges' }) {
  const config = PAGE_CONFIG[path] || PAGE_CONFIG['/concept/verified-challenges'];
  const Icon = config.icon;
  const [preference, setPreference] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!CONCEPTS_ENABLED) return;
    void trackWorksideEvent('concept_page_viewed', {
      concept: config.id,
      version: 'phase0-v0',
    }, { page: path });
  }, [config.id, path]);

  const shareMessage = useMemo(() => {
    if (config.id === 'verified_challenges') return 'Challenge a friend. Verify the reps. Move up together.';
    if (config.id === 'sagescore') return 'Train consistently. See why your progress is changing.';
    if (config.id === 'achievements') return 'Your workouts should not disappear into a log.';
    return 'A workout plan that changes when you do.';
  }, [config.id]);

  if (!CONCEPTS_ENABLED) {
    return <Navigate to="/" replace />;
  }

  const handleCta = () => {
    void trackWorksideEvent('concept_cta_clicked', {
      concept: config.id,
      cta: config.cta,
      version: 'phase0-v0',
    }, { page: path });
    setSubmitted(true);
  };

  const submitPreference = (value) => {
    setPreference(value);
    void trackWorksideEvent('concept_preference_submitted', {
      concept: config.id,
      preference: value,
      version: 'phase0-v0',
    }, { page: path });
  };

  return (
    <main className="bg-gray-950 text-white">
      <section className="overflow-hidden border-b border-white/10 bg-gradient-to-br from-gray-950 via-gray-900 to-sage-950/40 py-16">
        <div className="mx-auto grid max-w-content gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sage-300/30 bg-sage-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sage-300">
              <Icon className="h-5 w-5" />
              {config.eyebrow}
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">{config.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">{config.body}</p>
            <p className="mt-5 text-lg font-bold text-sage-300">{shareMessage}</p>
            <button type="button" onClick={handleCta} className="mt-8 rounded-xl bg-sage-500 px-7 py-3 font-bold text-white hover:bg-sage-600">
              {submitted ? 'Thanks for the signal' : config.cta}
            </button>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Validation preview · Nothing here changes your SageSet account</p>
          </div>

          <div className="rounded-3xl border border-sage-300/20 bg-black/50 p-4 shadow-2xl shadow-sage-950/40">
            <div className="rounded-2xl border border-white/10 bg-gray-900 p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-sage-300">SageSet</p><p className="mt-1 text-sm text-gray-400">{config.id === 'verified_challenges' ? 'Weekly challenge' : config.id === 'achievements' ? 'Achievement unlocked' : 'Your starting point'}</p></div>
                <Icon className="h-8 w-8 text-sage-300" />
              </div>
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-sage-700/70 to-gray-950 p-6">
                {config.id === 'verified_challenges' ? <CheckBadgeIcon className="h-14 w-14 text-sage-200" /> : config.id === 'achievements' ? <TrophyIcon className="h-14 w-14 text-yellow-300" /> : <SparklesIcon className="h-14 w-14 text-sage-200" />}
                <p className="mt-6 text-3xl font-black">{config.statLabel}</p>
                <p className="mt-2 text-sm font-semibold text-gray-300">{config.statBody}</p>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[68%] rounded-full bg-sage-300" /></div>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-sage-200">Concept only · Verify before launch</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 text-gray-950">
        <div className="mx-auto max-w-content px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-sage-700">Help shape what comes next</p>
            <h2 className="mt-3 text-3xl font-black">How would you want competition to feel?</h2>
            <p className="mt-4 text-gray-600">Your choice is recorded as anonymous validation feedback. It does not enable a feature.</p>
          </div>
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
            {preferenceOptions.map((option) => (
              <button key={option.id} type="button" onClick={() => submitPreference(option.id)} className={`rounded-2xl border p-5 text-left transition ${preference === option.id ? 'border-sage-600 bg-sage-50 ring-2 ring-sage-200' : 'border-gray-200 bg-gray-50 hover:border-sage-400'}`}>
                <p className="font-black">{option.label}</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">{option.body}</p>
              </button>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/signup" onClick={() => void trackWorksideEvent('concept_waitlist_intent', { concept: config.id, version: 'phase0-v0' }, { page: path })} className="font-bold text-sage-700 hover:text-sage-900">Start with SageSet today →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
