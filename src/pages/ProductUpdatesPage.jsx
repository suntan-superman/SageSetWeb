import { Link } from 'react-router-dom';
import ProductEvolutionSection from '../components/ProductEvolutionSection.jsx';
import { trackWorksideEvent } from '../services/worksideAnalytics.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProductUpdatesPage() {
  const { user } = useAuth();
  const trackTrial = () => {
    void trackWorksideEvent('cta_click_start_trial', {
      placement: 'product_updates',
      route: '/upcoming',
    });
  };

  return (
    <div>
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
