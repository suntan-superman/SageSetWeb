import { NavLink } from 'react-router-dom';
import { COPYRIGHT_NOTICE } from '../constants/appInfo';

const navLinkClass = ({ isActive }) =>
  [
    'text-sm font-medium transition-colors',
    isActive ? 'text-sage-700' : 'text-gray-600 hover:text-sage-700',
  ].join(' ');

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-gray-800 bg-white">
      {/* Sticky, minimal navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="SageSet"
              className="h-8 w-8 rounded-lg"
              loading="eager"
            />
            <span className="text-lg font-semibold tracking-tight text-gray-900">SageSet</span>
          </NavLink>

          <nav className="flex items-center gap-6">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/privacy" className={navLinkClass}>
              Privacy
            </NavLink>
            <NavLink to="/terms" className={navLinkClass}>
              Terms
            </NavLink>
            <NavLink to="/support" className={navLinkClass}>
              Support
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Minimal footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-content mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">SageSet</span>
            <span className="text-gray-300">•</span>
            <span>{COPYRIGHT_NOTICE}</span>
          </div>
          <div className="flex items-center gap-6">
            <NavLink to="/privacy" className="hover:text-sage-700 transition-colors">
              Privacy
            </NavLink>
            <NavLink to="/terms" className="hover:text-sage-700 transition-colors">
              Terms
            </NavLink>
            <NavLink to="/support" className="hover:text-sage-700 transition-colors">
              Support
            </NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
