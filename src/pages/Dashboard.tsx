import { useAuth } from '../contexts/AuthContext';
import { useUser, useAuth as useClerkAuth, useSession } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import apiClient from '../utils/api';

interface Session {
  sessionId: string;
  title: string;
  updatedAt: string;
  language: string;
  isActive: boolean;
}

const Dashboard: React.FC = () => {
  const { user: authUser, isAuthenticated, loading, isClerkLoaded, hasBackendSyncFailed, isBackendSyncInProgress } = useAuth();
  const { user: clerkUser, isSignedIn, isLoaded: isClerkUserLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const { session } = useSession();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const createNewSession = async () => {
    try {
      // Don't proceed if session is not ready or user is not authenticated
      if (!session) {
        alert('Session not ready. Please sign in again.');
        return;
      }

      // Check if user is actually authenticated via Clerk
      if (!isSignedIn) {
        alert('User not authenticated. Please sign in again.');
        return;
      }
      

      // Additional check: verify session status and user details
      console.log("Session details:", {
        status: session.status,
        id: session.id,
        userId: session.user?.id, // Use session.user?.id instead of session.userId
        lastActiveAt: session.lastActiveAt
      });

      // Get the Clerk authentication token using the proper Clerk hooks
      const token = session ? await session.getToken() : null;
      console.log("Generated token:", token ? "Token present" : "Token not generated");
      const response = await apiClient.post('/api/sessions', {}, token || undefined); 
 
      if (response.ok) { 
        const data = await response.json(); 
        // Redirect to the new session editor page 
        navigate(`/session/${data.sessionId}`); 
      } else { 
        console.error('Failed to create session:', await response.text()); 
        alert('Failed to create session'); 
      } 
    } catch (error) { 
      console.error('Error creating session:', error); 
      alert('Error creating session'); 
    } 
  };

  // Fetch user's sessions on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Don't fetch if session is not ready
        if (!session) {
          setSessionsError('Authentication not ready');
          return;
        }

        // Check if user is actually authenticated via Clerk
        if (!isSignedIn) {
          setSessionsError('User not authenticated');
          return;
        }

        // Additional check: verify session status and user details
        console.log("Session details in fetch:", {
          status: session.status,
          id: session.id,
          userId: session.user?.id, // Use session.user?.id instead of session.userId
          lastActiveAt: session.lastActiveAt
        });

        setSessionsLoading(true);
        // Get the Clerk authentication token
        const token = await session.getToken();
        console.log("Generated token in fetch:", token ? "Token present" : "Token not generated");
        const response = await apiClient.get('/api/sessions', token || undefined);

        console.log("RESPONSE--->", response)

        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        } else if (response.status === 401) {
          setSessionsError('Authentication required');
        } else {
          setSessionsError('Failed to load sessions');
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setSessionsError('Error connecting to server');
      } finally {
        setSessionsLoading(false);
      }
    };

    if (session) {
      fetchSessions();
    }
  }, [session]);

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
                {authUser?.role === 'admin' && (
                  <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                    ADMIN
                  </span>
                )}
              </div>
              {authUser?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Admin Dashboard
                </button>
              )}
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
                  <button
                    onClick={createNewSession}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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

              {/* User's Sessions Section */}
              <div className="border-gray cursor-pointer rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your Sessions</h3>
                {sessionsLoading ? (
                  <div className="text-gray-500">Loading sessions...</div>
                ) : sessionsError ? (
                  <div className="text-red-500">{sessionsError}</div>
                ) : sessions.length > 0 ? (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className="flex justify-between items-center p-2 border rounded cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/session/${session.sessionId}`)}
                      >
                        <div>
                          <div className="font-medium">{session.title}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(session.updatedAt).toLocaleString()} • {session.language}
                          </div>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {session.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No sessions yet. Create your first session!</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;