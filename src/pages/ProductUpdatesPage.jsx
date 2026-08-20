import { Link } from 'react-router-dom';
import { CameraIcon } from '@heroicons/react/24/outline';
import ProductEvolutionSection from '../components/ProductEvolutionSection.jsx';
import { trackWorksideEvent } from '../services/worksideAnalytics.js';
import { trackCustomEvent } from '../services/metaPixel.js';
import { useAuth } from '../context/AuthContext.jsx';
import { APP_STORE_URL } from '../config/storeLinks.js';

export default function ProductUpdatesPage() {
  const { user } = useAuth();
  const trackTrial = () => {
    void trackWorksideEvent('cta_click_start_trial', {
      placement: 'product_updates',
      route: '/upcoming',
    });
  };
  const trackDownload = () => {
    trackCustomEvent('DownloadClicked', { source: 'whats_new_ar_squats', store: 'apple' });
    void trackWorksideEvent('download_click_ios', {
      placement: 'product_updates_featured_release',
      feature: 'ar_squats',
    });
  };

  return (
    <div>
      <section className="overflow-hidden bg-gray-950 py-14 text-white">
        <div className="mx-auto grid max-w-content gap-10 px-6 lg:grid-cols-[1fr_0.6fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sage-300/30 bg-sage-400/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] text-sage-300">
              <CameraIcon className="h-5 w-5" />
              Available now on the App Store
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">AR Squats are here.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">
              SageSet can now see your movement and automatically count completed squat reps in a
              guided challenge. Real-time body tracking keeps the experience hands-free so you can
              focus on your form and effort.
            </p>
            <p className="mt-4 font-semibold text-sage-300">
              You keep progressing. So do we.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={APP_STORE_URL}
                onClick={trackDownload}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-sage-500 px-7 py-3 text-center font-semibold text-white hover:bg-sage-600"
              >
                Download for iPhone
              </a>
              <Link
                to="/ar-squats"
                className="rounded-xl border border-white/20 px-7 py-3 text-center font-semibold text-white hover:border-sage-300 hover:text-sage-200"
              >
                See AR Squats in action
              </Link>
            </div>
          </div>
          <Link
            to="/ar-squats"
            className="mx-auto block w-full max-w-[330px] overflow-hidden rounded-2xl border border-sage-300/20 bg-black"
            aria-label="Watch the AR Squats launch video"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/ar-squats-launch-poster.jpg"
              className="aspect-[9/16] w-full object-cover"
            >
              <source src="/ar-squats-launch-reel.mp4" type="video/mp4" />
            </video>
          </Link>
        </div>
      </section>
      <ProductEvolutionSection />
      <section className="bg-white py-14">
        <div className="mx-auto max-w-content px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sage-700">
            Progress is the product
          </p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            Build momentum today. Grow with SageSet tomorrow.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Start with personalized plans, nutrition estimates, and progress tracking. New capabilities
            roll out carefully as they are ready—without asking you to start over.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              onClick={trackTrial}
              className="rounded-xl bg-sage-700 px-7 py-3 font-semibold text-white hover:bg-sage-800"
            >
              Start your free 14-day trial
            </Link>
            <Link
              to="/dashboard/account"
              className="rounded-xl border border-gray-300 px-7 py-3 font-semibold text-gray-700 hover:border-sage-600 hover:text-sage-700"
            >
              {user ? 'Manage product updates' : 'Sign in to manage updates'}
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Release timing may change as features move through testing and platform review.
          </p>
        </div>
      </section>
    </div>
  );
}
