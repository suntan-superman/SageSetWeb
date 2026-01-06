import { NavLink } from 'react-router-dom';

import { COPYRIGHT_NOTICE } from '../constants/appInfo';

const navLinkClass = ({ isActive }) =>
  [
    'text-sm font-medium',
    isActive ? 'text-green-700' : 'text-gray-700 hover:text-green-700',
  ].join(' ');

export default function Layout({ children }) {
  return (
    <div className="min-h-screen font-sans antialiased text-gray-900 bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between max-w-6xl px-4 py-4 mx-auto sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="SageSet"
              className="rounded-lg h-9 w-9"
              loading="eager"
            />
            <div>
              <div className="text-lg font-bold tracking-tight">SageSet Fitness</div>
              <div className="text-xs font-medium text-gray-600">Personal-first fitness planning</div>
            </div>
          </NavLink>

          <nav className="flex items-center gap-5">
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

      <main className="w-full max-w-6xl px-4 py-10 mx-auto sm:px-6 lg:px-8">{children}</main>

      <footer className="bg-white border-t border-gray-200">
        <div className="flex flex-col max-w-6xl gap-3 px-4 py-6 mx-auto text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>{COPYRIGHT_NOTICE}</div>
          <div className="flex gap-4">
            <NavLink to="/support" className="hover:text-green-700">
              Support
            </NavLink>
            <NavLink to="/privacy" className="hover:text-green-700">
              Privacy Policy
            </NavLink>
            <NavLink to="/terms" className="hover:text-green-700">
              Terms of Use
            </NavLink>
            <a className="hover:text-green-700" href="mailto:support@worksidesoftware.com">
              support@worksidesoftware.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
