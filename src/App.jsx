import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import MarketingLandingPage from './pages/MarketingLandingPage.jsx';
import SimpleInfoPage from './pages/SimpleInfoPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx';
import TermsOfServicePage from './pages/TermsOfServicePage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import AccountDeletionPage from './pages/AccountDeletionPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminExercisesPage from './pages/AdminExercisesPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminUsagePage from './pages/AdminUsagePage.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { initMetaPixel, trackPageView } from './services/metaPixel.js';
import { useEffect } from 'react';

// Protected route component for admin pages
function ProtectedAdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Loading...</div>
      </div>
    );
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
}

function ProtectedMemberRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-sage-300 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.emailVerified && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}

function PixelRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    initMetaPixel();
  }, []);

  useEffect(() => {
    trackPageView();
  }, [location.pathname, location.search]);

  return null;
}

const marketingRoutes = [
  '/fitness-ai-coach',
  '/workout-plans',
  '/weight-loss',
  '/muscle-building',
  '/nutrition',
  '/fitness-challenges',
  '/features',
  '/pricing',
  '/download',
];

const infoRoutes = [
  '/testimonials',
  '/before-after',
  '/faq',
  '/supported-devices',
  '/blog',
  '/billing/success',
  '/billing/cancel',
  '/account/billing',
];

export default function App() {
  return (
    <AuthProvider>
      <PixelRouteTracker />
      <Routes>
        {/* Admin routes - no Layout wrapper */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
          path="/admin/users"
          element={
            <ProtectedAdminRoute>
              <AdminUsersPage />
            </ProtectedAdminRoute>
          }
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedAdminRoute>
              <AdminDashboardPage />
            </ProtectedAdminRoute>
          } 
        />
        <Route 
          path="/admin/exercises" 
          element={
            <ProtectedAdminRoute>
              <AdminExercisesPage />
            </ProtectedAdminRoute>
          } 
        />
        <Route
          path="/admin/usage"
          element={
            <ProtectedAdminRoute>
              <AdminUsagePage />
            </ProtectedAdminRoute>
          }
        />
        
        {/* Public routes with Layout */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/login" element={<Layout><AuthPage mode="login" /></Layout>} />
        <Route path="/signup" element={<Layout><AuthPage mode="signup" /></Layout>} />
        <Route path="/verify-email" element={<Layout><VerifyEmailPage /></Layout>} />
        <Route
          path="/dashboard"
          element={<Layout><ProtectedMemberRoute><DashboardPage section="overview" /></ProtectedMemberRoute></Layout>}
        />
        <Route
          path="/dashboard/progress"
          element={<Layout><ProtectedMemberRoute><DashboardPage section="progress" /></ProtectedMemberRoute></Layout>}
        />
        <Route
          path="/dashboard/workouts"
          element={<Layout><ProtectedMemberRoute><DashboardPage section="workouts" /></ProtectedMemberRoute></Layout>}
        />
        <Route
          path="/dashboard/nutrition"
          element={<Layout><ProtectedMemberRoute><DashboardPage section="nutrition" /></ProtectedMemberRoute></Layout>}
        />
        <Route
          path="/dashboard/account"
          element={<Layout><ProtectedMemberRoute><DashboardPage section="account" /></ProtectedMemberRoute></Layout>}
        />
        <Route
          path="/dashboard/billing"
          element={<Layout><ProtectedMemberRoute><DashboardPage section="billing" /></ProtectedMemberRoute></Layout>}
        />
        {marketingRoutes.map((path) => (
          <Route
            key={path}
            path={path}
            element={<Layout><MarketingLandingPage path={path} /></Layout>}
          />
        ))}
        {infoRoutes.map((path) => (
          <Route
            key={path}
            path={path}
            element={<Layout><SimpleInfoPage path={path} /></Layout>}
          />
        ))}
        <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
        <Route path="/terms" element={<Layout><TermsOfServicePage /></Layout>} />
        <Route path="/support" element={<Layout><SupportPage /></Layout>} />
        <Route path="/contact" element={<Layout><SupportPage /></Layout>} />
        <Route path="/account-deletion" element={<Layout><AccountDeletionPage /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
