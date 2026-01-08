import { CheckCircleIcon, CalendarDaysIcon, SparklesIcon } from '@heroicons/react/24/outline';

const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || '';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="pt-10 pb-4 bg-white lg:pt-14 lg:pb-8">
        <div className="px-6 mx-auto max-w-content">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Fitness planning,{' '}
              <span className="text-sage-600">simplified.</span>
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-gray-600">
              A calm, personal approach to workout planning. Build your routine, track your progress, and stay consistent—without the noise.
            </p>
            <div className="mt-4">
              {APP_STORE_URL ? (
                <a
                  href={APP_STORE_URL}
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-colors bg-sage-700 rounded-xl hover:bg-sage-800"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download on the App Store
                </a>
              ) : (
                <span className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-sage-700 rounded-xl">
                  Coming Soon
                </span>
              )}
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
              title="Sustainable fitness"
              description="No gimmicks or pressure. Just a simple tool to help you stay on track, day after day."
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
            <div className="w-full max-w-2xl">
              <video
                controls
                poster="/Sage Set Poster.png"
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
            Questions? Reach out at{' '}
            <a href="mailto:support@worksidesoftware.com" className="font-medium text-sage-700 hover:text-sage-800">
              support@worksidesoftware.com
            </a>
          </p>
        </div>
      </section>
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
