import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx';
import TermsOfServicePage from './pages/TermsOfServicePage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import AccountDeletionPage from './pages/AccountDeletionPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Admin routes - no Layout wrapper */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedAdminRoute>
              <AdminDashboardPage />
            </ProtectedAdminRoute>
          } 
        />
        
        {/* Public routes with Layout */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
        <Route path="/terms" element={<Layout><TermsOfServicePage /></Layout>} />
        <Route path="/support" element={<Layout><SupportPage /></Layout>} />
        <Route path="/account-deletion" element={<Layout><AccountDeletionPage /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
