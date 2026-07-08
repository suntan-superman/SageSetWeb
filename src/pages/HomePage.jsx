import {
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { trackCustomEvent, trackEvent } from '../services/metaPixel';

const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || '';

export default function HomePage() {
  const handleDownloadClick = () => {
    trackCustomEvent('DownloadClicked', { source: 'home_hero' });
  };

  const handleVideoPlay = () => {
    trackEvent('ViewContent', { content_name: 'SageSet demo video', content_category: 'video' });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="pt-10 pb-6 bg-white lg:pt-14 lg:pb-10">
        <div className="px-6 mx-auto max-w-content">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-sage-700">
              <span className="inline-flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((item) => (
                  <StarIcon key={item} className="h-4 w-4 fill-sage-600 text-sage-600" />
                ))}
              </span>
              <span>AI powered</span>
              <span className="text-gray-300">|</span>
              <span>14-day free trial</span>
              <span className="text-gray-300">|</span>
              <span>No credit card required</span>
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Train with purpose. Adapt with intelligence.
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-gray-600">
              SageSet builds structured workout plans, tracks performance, estimates meals, and recommends smart adjustments before future workouts change.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="/signup"
                onClick={() => trackEvent('Lead', { source: 'home_hero' })}
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-colors bg-sage-700 rounded-xl hover:bg-sage-800"
              >
                Start Your 14-Day Free Trial
              </a>
              {APP_STORE_URL ? (
                <a
                  href={APP_STORE_URL}
                  onClick={handleDownloadClick}
                  className="ml-3 inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-sage-700 transition-colors bg-white border border-sage-200 rounded-xl hover:border-sage-700"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download app
                </a>
              ) : null}
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">AI recommends. You decide. No credit card required. Available on iPhone and Android.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <TrustPill icon={SparklesIcon} label="AI Powered" />
              <TrustPill icon={CheckCircleIcon} label="Personalized Plans" />
              <TrustPill icon={ChartBarIcon} label="Progress Tracking" />
              <TrustPill icon={CalendarDaysIcon} label="14-Day Trial" />
              <TrustPill icon={DevicePhoneMobileIcon} label="Mobile Ready" />
            </div>
          </div>
        </div>
      </section>

      {/* Value Sections */}
      <section className="pt-10 pb-8 bg-gray-50 lg:pt-12 lg:pb-12">
        <div className="px-6 mx-auto max-w-content">
          <div className="grid gap-12 lg:grid-cols-3">
            <ValueCard
              icon={CheckCircleIcon}
              title="Personalized plans"
              description="Create workout plans that fit your schedule. Organize by days, workouts, and exercises—your way."
            />
            <ValueCard
              icon={CalendarDaysIcon}
              title="Progress tracking"
              description="Mark sets complete, log weigh-ins, and watch your consistency build over time."
            />
            <ValueCard
              icon={SparklesIcon}
              title="AI coach guidance"
              description="Review recommendations that connect your plan, meals, and progress while keeping you in control."
            />
          </div>
        </div>
      </section>

      {/* App Preview / Video Section */}
      <section className="py-8 bg-white">
        <div className="px-6 mx-auto max-w-content">
          <div className="max-w-2xl mx-auto mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">See it in action</h2>
            <p className="mt-4 text-lg text-gray-600">
              A quick look at how SageSet helps you plan and track your workouts.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <video
                controls
                poster="/Sage Set Poster.png"
                onPlay={handleVideoPlay}
                className="w-full shadow-lg rounded-2xl"
              >
                <source src="/Sage Set Fitness.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-10 bg-sage-50">
        <div className="px-6 mx-auto text-center max-w-content">
          <h2 className="text-2xl font-semibold text-gray-900">Ready to get started?</h2>
          <p className="mt-3 text-gray-600">
            Start with a 14-day free trial. No credit card required.
          </p>
          <p className="mt-4">
            <a href="/signup" className="font-semibold text-sage-700 hover:text-sage-800">
              Start Your 14-Day Free Trial
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

function TrustPill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm">
      <Icon className="h-4 w-4 text-sage-700" />
      <span>{label}</span>
    </div>
  );
}

function ValueCard({ icon: Icon, title, description }) {
  return (
    <div className="text-center lg:text-left">
      <div className="inline-flex items-center justify-center w-12 h-12 mb-5 rounded-xl bg-sage-100">
        <Icon className="w-6 h-6 text-sage-700" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mt-3 leading-relaxed text-gray-600">{description}</p>
    </div>
  );
}
