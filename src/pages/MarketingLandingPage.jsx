import {
  ArrowDownTrayIcon,
  BoltIcon,
  CameraIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  FireIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { trackCustomEvent, trackEvent } from '../services/metaPixel';

const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || '';

const pageContent = {
  '/fitness-ai-coach': {
    eyebrow: 'AI fitness coach',
    title: 'A calmer coach for stronger weeks.',
    body: 'SageSet helps you turn goals into practical workout plans, daily check-ins, and momentum you can actually see.',
    icon: SparklesIcon,
    event: 'ViewContent',
    bullets: ['Personalized plan generation', 'Daily readiness check-ins', 'Progress-aware coaching foundation'],
  },
  '/workout-plans': {
    eyebrow: 'Workout plans',
    title: 'Build the plan. Then keep showing up.',
    body: 'Create structured routines, repeat exercises intelligently, and see the last weight and reps when it matters.',
    icon: ClipboardDocumentCheckIcon,
    event: 'ViewContent',
    bullets: ['Strength, cardio, and hybrid schedules', 'Set-by-set workout logging', 'Last-performance references'],
  },
  '/weight-loss': {
    eyebrow: 'Weight loss',
    title: 'Consistency tools for sustainable weight loss.',
    body: 'Combine workouts, weigh-ins, food photos, and adherence tracking without turning fitness into a second job.',
    icon: ChartBarIcon,
    event: 'ViewContent',
    bullets: ['Weight trend tracking', 'Workout completion analytics', 'Food photo calorie estimates'],
  },
  '/muscle-building': {
    eyebrow: 'Muscle building',
    title: 'Progressive strength work without spreadsheet chaos.',
    body: 'Log each set, reference your previous effort, and make the next session obvious.',
    icon: FireIcon,
    event: 'ViewContent',
    bullets: ['Previous weight and rep cues', 'Exercise history foundation', 'Completion scoring'],
  },
  '/nutrition': {
    eyebrow: 'Nutrition',
    title: 'Log food from a photo in seconds.',
    body: "SageSet estimates calories and macros from meal photos, then keeps your day's nutrition visible.",
    icon: CameraIcon,
    event: 'ViewContent',
    bullets: ['Photo-based estimates', 'Protein, carbs, fat, and calories', 'Daily safeguards against overuse'],
  },
  '/fitness-challenges': {
    eyebrow: 'Fitness challenges',
    title: 'Challenges that reward real consistency.',
    body: 'SageSet is preparing AR workout challenges and habit-based streaks for users who want extra motivation.',
    icon: BoltIcon,
    event: 'ViewContent',
    bullets: ['Streak-aware progress', 'Challenge-ready data model', 'Premium feature controls'],
  },
  '/features': {
    eyebrow: 'Features',
    title: 'Everything needed for a cleaner fitness loop.',
    body: 'Plans, workouts, nutrition, weigh-ins, streaks, reminders, and admin controls are coming together in one app.',
    icon: CheckCircleIcon,
    event: 'ViewContent',
    bullets: ['Workout planning', 'Nutrition estimates', 'Streaks and check-ins'],
  },
  '/pricing': {
    eyebrow: 'Pricing',
    title: 'Start free. Keep going for $9.99/month.',
    body: 'Try SageSet Premium free for 14 days. Continue only if it helps you train with less friction.',
    icon: CheckCircleIcon,
    event: 'TrialStarted',
    bullets: ['14-day free trial', '$9.99 monthly plan', 'Cancel through Stripe billing'],
  },
  '/download': {
    eyebrow: 'Download',
    title: 'Bring SageSet to your next workout.',
    body: 'Download the mobile app to build plans, log sessions, scan meals, and keep your streak alive.',
    icon: ArrowDownTrayIcon,
    event: 'DownloadClicked',
    bullets: ['Mobile-first workout flow', 'Food photo analysis', 'Daily reminders'],
  },
};

const fallbackContent = {
  eyebrow: 'SageSet',
  title: 'Fitness planning that stays out of your way.',
  body: 'A focused mobile app for plans, workouts, nutrition, streaks, and sustainable progress.',
  icon: SparklesIcon,
  event: 'ViewContent',
  bullets: ['Personalized training', 'Simple tracking', 'Daily momentum'],
};

export default function MarketingLandingPage({ path = '/' }) {
  const content = pageContent[path] || fallbackContent;
  const Icon = content.icon;

  const handlePrimaryClick = () => {
    if (path === '/download') {
      trackCustomEvent('DownloadClicked', { source: path });
    } else if (path === '/pricing') {
      trackCustomEvent('TrialStarted', { source: path, value: 9.99, currency: 'USD' });
    } else {
      trackEvent(content.event, { content_name: content.title, content_category: 'marketing_page' });
    }
  };

  return (
    <div>
      <section className="bg-white">
        <div className="mx-auto grid max-w-content gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sage-700">{content.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
              {content.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">{content.body}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {APP_STORE_URL ? (
                <a
                  href={APP_STORE_URL}
                  onClick={handlePrimaryClick}
                  className="inline-flex items-center justify-center rounded-lg bg-sage-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-sage-800"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download SageSet
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handlePrimaryClick}
                  className="inline-flex items-center justify-center rounded-lg bg-sage-700 px-6 py-3 text-base font-semibold text-white"
                >
                  App Store coming soon
                </button>
              )}
              <a
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-800 transition-colors hover:border-sage-600 hover:text-sage-700"
              >
                See pricing
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 shadow-xl">
            <img
              src="/Sage Set Poster.png"
              alt="SageSet mobile app preview"
              className="h-full max-h-[520px] w-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-10">
        <div className="mx-auto grid max-w-content gap-5 px-6 md:grid-cols-3">
          {content.bullets.map((bullet) => (
            <div key={bullet} className="rounded-lg border border-gray-200 bg-white p-5">
              <Icon className="h-7 w-7 text-sage-700" />
              <p className="mt-4 text-lg font-semibold text-gray-900">{bullet}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
