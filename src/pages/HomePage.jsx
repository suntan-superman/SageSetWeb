import { ArrowTopRightOnSquareIcon, CheckCircleIcon, CalendarDaysIcon, ScaleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || '';
const PLAY_STORE_URL = import.meta.env.VITE_PLAY_STORE_URL || '';

const Feature = ({ icon: Icon, title, description }) => (
  <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50">
        <Icon className="w-6 h-6 text-green-700" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="mt-3 text-sm leading-relaxed text-gray-700">{description}</p>
  </div>
);

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              SageSet Fitness
            </h1>
            <p className="mt-4 text-lg font-medium text-gray-700">
              A personal-first workout planner with progress tracking, weigh-ins, calendar, and AI-generated plans.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Built by Workside Software LLC. Designed for daily use.
            </p>

            <div className="flex flex-col gap-3 mt-6 sm:flex-row">
              {APP_STORE_URL && (
                <a
                  href={APP_STORE_URL}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download on the App Store
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </a>
              )}
              {PLAY_STORE_URL && (
                <a
                  href={PLAY_STORE_URL}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-xl hover:border-green-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get it on Google Play
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* {(!APP_STORE_URL || !PLAY_STORE_URL) && (
              <p className="mt-3 text-xs font-medium text-gray-500">
                App store links can be set via `VITE_APP_STORE_URL` and `VITE_PLAY_STORE_URL`.
              </p>
            )} */}
          </div>

          <div className="p-6 rounded-2xl bg-green-50">
            <div className="flex items-center gap-4">
              <img
                src="/app-icon-1024.png"
                alt="SageSet app icon"
                className="w-16 h-16 rounded-2xl"
              />
              <div>
                <div className="text-sm font-semibold text-green-900">What you get</div>
                <div className="mt-1 text-sm text-green-900/80">
                  Plans → Days → Workouts → Exercises, plus weigh-ins and calendar.
                </div>
              </div>
            </div>

            <div className="grid gap-3 mt-6">
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl">
                <CheckCircleIcon className="w-5 h-5 text-green-700" />
                <div className="text-sm font-medium text-gray-800">Track completion with checkmarks</div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl">
                <CalendarDaysIcon className="w-5 h-5 text-green-700" />
                <div className="text-sm font-medium text-gray-800">See workouts on your calendar</div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl">
                <ScaleIcon className="w-5 h-5 text-green-700" />
                <div className="text-sm font-medium text-gray-800">Log weigh-ins and goals</div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl">
                <SparklesIcon className="w-5 h-5 text-green-700" />
                <div className="text-sm font-medium text-gray-800">Generate an AI plan (optional)</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="p-8 overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">See SageSet in Action</h2>
        <div className="flex justify-center">
          <video
            controls
            poster="/Sage Set Poster.png"
            className="w-1/2 rounded-xl"
          >
            <source src="/Sage Set Fitness.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Feature
          icon={CheckCircleIcon}
          title="Today-first"
          description="Open the app, see today’s workouts, and check off sets with minimal friction."
        />
        <Feature
          icon={CalendarDaysIcon}
          title="Calendar view"
          description="Plan, track, and review your routine over the month at a glance."
        />
        <Feature
          icon={ScaleIcon}
          title="Weigh-ins & goals"
          description="Log your weight, set targets, and track progress over time."
        />
        <Feature
          icon={SparklesIcon}
          title="AI plan builder"
          description="Generate a structured training + nutrition framework using Cloud Functions (your data stays protected)."
        />
      </section>

      <section className="p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <h2 className="text-2xl font-bold text-gray-900">About SageSet</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          SageSet Fitness is a personal planning tool, not medical advice. Always consult your physician before
          beginning any new exercise program.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          For support, contact{' '}
          <a className="font-semibold text-green-700 hover:text-green-800" href="mailto:support@worksidesoftware.com">
            support@worksidesoftware.com
          </a>
          .
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          Domain: <span className="font-semibold">sagesetfitness.com</span>
        </p>
      </section>

      <section className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <h2 className="text-lg font-semibold text-gray-900">Links</h2>
        <div className="flex flex-wrap mt-3 text-sm font-medium gap-x-4 gap-y-2">
          <Link className="text-green-700 hover:text-green-800" to="/support">
            Support
          </Link>
          <Link className="text-green-700 hover:text-green-800" to="/privacy">
            Privacy Policy
          </Link>
          <Link className="text-green-700 hover:text-green-800" to="/terms">
            Terms of Service
          </Link>
        </div>
      </section>
    </div>
  );
}
