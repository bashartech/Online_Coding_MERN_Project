import { Link, Navigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
// import { useEffect } from 'react';

const Home: React.FC = () => {
  const { isAuthenticated, loading, isClerkLoaded, isClerkSignedIn, hasBackendSyncFailed, isBackendSyncInProgress } = useAuth();

  // Only redirect if Clerk is loaded and user is authenticated
  // Allow redirect if user is signed in with Clerk and sync is not failed
  // Don't redirect if backend sync is still in progress to avoid redirect loops
  const shouldRedirect = isClerkLoaded && !loading && isAuthenticated && !hasBackendSyncFailed;

  if (shouldRedirect) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Code Collaborate
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            A real-time code collaboration platforms
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link
            to="/login"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in to your account
          </Link>
          <Link
            to="/signup"
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create new account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
 