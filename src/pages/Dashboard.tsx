import { useAuth } from '../contexts/AuthContext';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user: authUser, isAuthenticated, loading, isClerkLoaded, hasBackendSyncFailed, isBackendSyncInProgress } = useAuth();
  const { user: clerkUser, isSignedIn, isLoaded: isClerkUserLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const navigate = useNavigate();

  // Wait for both Clerk and our auth context to be fully loaded
  if (!isClerkLoaded || !isClerkUserLoaded || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // If user is signed in with Clerk but not yet fully authenticated with our backend,
  // allow them to stay on the dashboard while sync completes
  if (!isSignedIn) {
    // Only redirect if Clerk user is not signed in
    navigate('/login');
    return null;
  }

  // If user is signed in with Clerk but backend sync failed, we might want to handle this differently
  // For now, let them access the dashboard with Clerk credentials if needed
  if (!isAuthenticated && hasBackendSyncFailed) {
    console.warn("Backend sync failed but user is signed in with Clerk");
    // Optionally, we could show a warning or attempt to resync here
  }

  // If Clerk is signed in but backend sync is in progress, the user should still be able to access the dashboard
  // The sync should complete shortly after landing on the dashboard

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Code Collaborate Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {authUser?.avatar && (
                  <img
                    src={authUser.avatar}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {authUser?.firstName || authUser?.username || 'User'}
                </span>
              </div>
              <button
                onClick={async () => {
                  // Clear local token and user data
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');

                  // Sign out from Clerk
                  await signOut();

                  // Navigate to login
                  navigate('/login');
                }}
                className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Code Collaborate!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Information</h3>
                <ul className="space-y-2">
                  <li><strong>Username:</strong> {authUser?.username || 'Not set'}</li>
                  <li><strong>Email:</strong> {authUser?.email || 'Not available'}</li>
                  <li><strong>Name:</strong> {authUser?.firstName && authUser?.lastName
                    ? `${authUser.firstName} ${authUser.lastName}`
                    : 'Not set'}
                  </li>
                  <li><strong>Role:</strong> {authUser?.role || 'user'}</li>
                  <li><strong>Clerk ID:</strong> {authUser?.clerkId || 'N/A'}</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Create New Session
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Join Existing Session
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                    View Your Snippets
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;