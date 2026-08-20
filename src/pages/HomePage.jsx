import {
  CalendarDaysIcon,
  CameraIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { trackCustomEvent, trackEvent, trackMetaEvent } from '../services/metaPixel';
import { trackWorksideEvent } from '../services/worksideAnalytics.js';
import ProductEvolutionSection from '../components/ProductEvolutionSection.jsx';
import { APP_STORE_URL } from '../config/storeLinks.js';

export default function HomePage() {
  const handleDownloadClick = () => {
    trackCustomEvent('DownloadClicked', { source: 'home_ar_squats_hero', store: 'apple' });
    void trackWorksideEvent('download_click_ios', {
      placement: 'home_ar_squats_hero',
      destination: 'app_store',
      feature: 'ar_squats',
    });
  };

  const handleTrialClick = (placement) => {
    trackEvent('Lead', { source: placement });
    void trackWorksideEvent('cta_click_start_trial', { placement });
  };

  const handleVideoPlay = () => {
    trackMetaEvent({
      eventName: 'ViewContent',
      pixelParameters: {
        content_name: 'SageSet AR Squats launch video',
        content_category: 'video',
      },
    });
    void trackWorksideEvent('ar_squats_video_play', { placement: 'home_hero' });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="overflow-hidden bg-gray-950 py-10 text-white lg:py-14">
        <div className="mx-auto grid max-w-content gap-10 px-6 lg:grid-cols-[1.05fr_0.75fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sage-400/30 bg-sage-400/10 px-4 py-2 text-sm font-bold text-sage-300">
              <CameraIcon className="h-5 w-5" />
              New on the App Store
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-sage-700">
              <span className="mt-5 inline-flex items-center gap-1 text-sage-300">
                {[0, 1, 2, 3, 4].map((item) => (
                  <StarIcon key={item} className="h-4 w-4 fill-sage-400 text-sage-400" />
                ))}
              </span>
              <span className="mt-5 text-gray-300">AI powered</span>
              <span className="mt-5 text-gray-600">|</span>
              <span className="mt-5 text-gray-300">14-day free trial</span>
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your AI coach now tracks every squat.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-gray-300">
              AR Squats are live on iPhone. See real-time body tracking and automatic rep counts while SageSet helps you move through every challenge.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={APP_STORE_URL}
                onClick={handleDownloadClick}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-sage-500 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-sage-600"
              >
                Download for iPhone
              </a>
              <a
                href="/signup"
                onClick={() => handleTrialClick('home_ar_squats_hero')}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition-colors hover:border-sage-300 hover:text-sage-200"
              >
                Start Your 14-Day Free Trial
              </a>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-400">
              Included with every membership. No credit card required for your trial.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <TrustPill icon={CameraIcon} label="Live AR Squats" dark />
              <TrustPill icon={CheckCircleIcon} label="Personalized Plans" />
              <TrustPill icon={ChartBarIcon} label="Progress Tracking" />
              <TrustPill icon={CalendarDaysIcon} label="14-Day Trial" />
              <TrustPill icon={DevicePhoneMobileIcon} label="Built for iPhone" />
            </div>
          </div>
          <a
            href="/ar-squats"
            className="group mx-auto block w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-sage-300/20 bg-black shadow-2xl shadow-sage-900/50"
            aria-label="Learn more about SageSet AR Squats"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/ar-squats-launch-poster.jpg"
              onPlay={handleVideoPlay}
              className="aspect-[9/16] w-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            >
              <source src="/ar-squats-launch-reel.mp4" type="video/mp4" />
            </video>
          </a>
        </div>
      </section>

      {/* Value Sections */}
      <section className="pt-10 pb-8 bg-gray-50 lg:pt-12 lg:pb-12">
        <div className="px-6 mx-auto max-w-content">
          <div className="grid gap-12 lg:grid-cols-3">
            <ValueCard
              icon={CameraIcon}
              title="AR Squats"
              description="Step into frame and let real-time body tracking count completed reps while you focus on your movement."
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

      <ProductEvolutionSection compact />

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
            <a href="/signup" onClick={() => handleTrialClick('home_footer')} className="font-semibold text-sage-700 hover:text-sage-800">
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
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-gray-200">
      <Icon className="h-4 w-4 text-sage-300" />
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
