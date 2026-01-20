import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user: authUser } = useAuth();
  const { user: clerkUser } = useUser();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0D1117] text-white
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static border-r border-gray-800`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow">
              <span className="font-bold text-white">CC</span>
            </div>
            <h2 className="text-lg font-semibold tracking-wide">
              CodeCollab
            </h2>
          </div>

          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={toggleSidebar}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5">
          <ul className="space-y-2">
            <li>
              <Link
                to="/dashboard"
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${
                  isActive('/dashboard')
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
            </li>

            <li>
              <Link
                to="/profile"
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${
                  isActive('/profile')
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Profile
              </Link>
            </li>

            {authUser?.role === 'admin' && (
              <li>
                <Link
                  to="/admin"
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${
                    isActive('/admin')
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Footer User Info */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            {clerkUser?.imageUrl ? (
              <img
                src={clerkUser.imageUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {clerkUser?.firstName?.charAt(0) ||
                    clerkUser?.lastName?.charAt(0) ||
                    '?'}
                </span>
              </div>
            )}

            <div className="leading-tight">
              <p className="text-sm font-medium text-white">
                {clerkUser?.firstName && clerkUser?.lastName
                  ? `${clerkUser.firstName} ${clerkUser.lastName}`
                  : clerkUser?.username || 'User'}
              </p>
              <p className="text-xs text-gray-400">
                {authUser?.role === 'admin' ? 'Administrator' : 'User'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
