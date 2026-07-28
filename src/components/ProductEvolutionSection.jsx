import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  CameraIcon,
  DevicePhoneMobileIcon,
  HeartIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { loadPublicFeatureRollout } from '../services/productUpdates.js';

function getReleaseState(rollout, feature) {
  if (!rollout) return 'checking';
  return rollout.enabled === true && rollout.publicFeatures?.[feature] === true
    ? 'available'
    : 'upcoming';
}

const statusStyles = {
  available: 'bg-emerald-100 text-emerald-800',
  upcoming: 'bg-amber-100 text-amber-800',
  checking: 'bg-gray-100 text-gray-600',
  exploring: 'bg-blue-100 text-blue-800',
};

const statusLabels = {
  available: 'Available now',
  upcoming: 'Coming next',
  checking: 'Checking rollout',
  exploring: 'In development',
};

export default function ProductEvolutionSection({ compact = false }) {
  const [rollout, setRollout] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadPublicFeatureRollout()
      .then((value) => {
        if (active) setRollout(value);
      })
      .catch((error) => {
        console.warn('Unable to load public feature rollout:', error);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const features = useMemo(
    () => [
      {
        title: 'Camera-tracked AR squats',
        description:
          getReleaseState(rollout, 'squat') === 'available'
            ? 'Your iPhone can count full squat repetitions while visualizing body tracking in real time.'
            : 'Live squat tracking and automatic rep counting are moving through controlled rollout.',
        availability:
          getReleaseState(rollout, 'squat') === 'available'
            ? 'Available now on iPhone'
            : 'Coming to supported iPhones',
        status: loaded ? getReleaseState(rollout, 'squat') : 'checking',
        icon: CameraIcon,
      },
      {
        title: 'Live push-up counting',
        description:
          getReleaseState(rollout, 'pushup') === 'available'
            ? 'Side-profile body tracking counts completed push-up repetitions automatically.'
            : 'Push-up tracking is being refined with real-world testers before its wider release.',
        availability:
          getReleaseState(rollout, 'pushup') === 'available'
            ? 'Available now on iPhone'
            : 'Currently in controlled testing',
        status: loaded ? getReleaseState(rollout, 'pushup') : 'checking',
        icon: HeartIcon,
      },
      {
        title: 'Smart Return check-ins',
        description:
          getReleaseState(rollout, 'smartReturn') === 'available'
            ? 'Return recommendations help members resume training after vacations, illness, or busy weeks.'
            : 'A more human return experience will help members resume without losing their progress.',
        availability:
          getReleaseState(rollout, 'smartReturn') === 'available'
            ? 'Available to members'
            : 'Coming in a future update',
        status: loaded ? getReleaseState(rollout, 'smartReturn') : 'checking',
        icon: SparklesIcon,
      },
      {
        title: 'More movement intelligence',
        description:
          'Future camera-tracked exercises and coaching insights will build on each completed challenge.',
        availability: 'Android AR support planned for a future release',
        status: 'exploring',
        icon: DevicePhoneMobileIcon,
      },
    ],
    [loaded, rollout]
  );

  return (
    <section className={compact ? 'bg-gray-950 py-12 text-white' : 'bg-gray-950 py-16 text-white'}>
      <div className="mx-auto max-w-content px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
            You keep progressing. So do we.
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Your effort moves forward—and SageSet keeps getting better.
          </h2>
          <p className="mt-5 text-lg leading-8 text-gray-300">
            SageSet is built around consistent progress. As members complete workouts, build streaks,
            and reach new goals, we continue adding smarter ways to plan, measure, and adapt.
          </p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-xl bg-emerald-400/10 p-3">
                    <Icon className="h-6 w-6 text-emerald-300" />
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[feature.status]}`}>
                    {statusLabels[feature.status]}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-white">{feature.title}</h3>
                <p className="mt-3 leading-7 text-gray-300">{feature.description}</p>
                <p className="mt-4 text-sm font-semibold text-emerald-300">{feature.availability}</p>
              </article>
            );
          })}
        </div>

        {compact ? (
          <a
            href="/upcoming"
            className="mt-8 inline-flex items-center gap-2 font-semibold text-emerald-300 hover:text-emerald-200"
          >
            See what SageSet is building
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </section>
  );
}
