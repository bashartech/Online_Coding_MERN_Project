import { useAuth } from '../contexts/AuthContext';
import { useUser, useAuth as useClerkAuth, useSession } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import apiClient from '../utils/api';
import Sidebar from '../components/Sidebar';

interface Session {
  sessionId: string;
  title: string;
  updatedAt: string;
  language: string;
  isActive: boolean;
}

const Dashboard: React.FC = () => {
  const { user: authUser, isAuthenticated, loading, isClerkLoaded, hasBackendSyncFailed } = useAuth();
  const {isSignedIn, isLoaded: isClerkUserLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const { session } = useSession();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);

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
          console.error('Authentication not ready');
          return;
        }

        // Check if user is actually authenticated via Clerk
        if (!isSignedIn) {
          console.error('User not authenticated');
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
          console.error('Authentication required');
        } else {
          console.error('Failed to load sessions');
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
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
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-spin"></div>
            </div>
          </div>
          <div className="text-lg font-medium text-gray-700">Loading Dashboard</div>
          <div className="mt-2 text-sm text-gray-500">Preparing your workspace...</div>
        </div>
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

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    // <div className="flex h-screen bg-gray-50">
    //   <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

    //   {/* Main content */}
    //   <div className="flex-1 flex flex-col overflow-hidden">
    //     {/* Top navigation bar */}
    //     <nav className="bg-white shadow">
    //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    //         <div className="flex justify-between h-16">
    //           <div className="flex items-center">
    //             <button
    //               className="mr-4 text-gray-500 hover:text-gray-700 lg:hidden"
    //               onClick={toggleSidebar}
    //             >
    //               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
    //               </svg>
    //             </button>
    //             <h1 className="text-xl font-semibold text-gray-900">Code Collaborate Dashboard</h1>
    //           </div>
    //           <div className="flex items-center space-x-4">
    //             <div className="flex items-center space-x-2">
    //               {authUser?.avatar && (
    //                 <img
    //                   src={authUser.avatar}
    //                   alt="Avatar"
    //                   className="w-8 h-8 rounded-full"
    //                 />
    //               )}
    //               <span className="text-sm font-medium text-gray-700">
    //                 {authUser?.firstName || authUser?.username || 'User'}
    //               </span>
    //               {authUser?.role === 'admin' && (
    //                 <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
    //                   ADMIN
    //                 </span>
    //               )}
    //             </div>
    //             <button
    //               onClick={() => navigate('/profile')}
    //               className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
    //             >
    //               Profile
    //             </button>
    //             {authUser?.role === 'admin' && (
    //               <button
    //                 onClick={() => navigate('/admin')}
    //                 className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
    //               >
    //                 Admin Dashboard
    //               </button>
    //             )}
    //             <button
    //               onClick={async () => {
    //                 // Clear local token and user data
    //                 localStorage.removeItem('token');
    //                 localStorage.removeItem('user');

    //                 // Sign out from Clerk
    //                 await signOut();

    //                 // Navigate to login
    //                 navigate('/login');
    //               }}
    //               className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
    //             >
    //               Sign Out
    //             </button>
    //           </div>
    //         </div>
    //       </div>
    //     </nav>

    //     <main className="flex-1 overflow-y-auto p-6">
    //       <div className="max-w-7xl mx-auto">
    //         <div className="bg-white shadow rounded-lg p-6">
    //         <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Code Collaborate!</h2>
    //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    //           <div className="border rounded-lg p-4">
    //             <h3 className="text-lg font-medium text-gray-900 mb-2">User Information</h3>
    //             <ul className="space-y-2">
    //               <li><strong>Username:</strong> {authUser?.username || 'Not set'}</li>
    //               <li><strong>Email:</strong> {authUser?.email || 'Not available'}</li>
    //               <li><strong>Name:</strong> {authUser?.firstName && authUser?.lastName
    //                 ? `${authUser.firstName} ${authUser.lastName}`
    //                 : 'Not set'}
    //               </li>
    //               <li><strong>Role:</strong> {authUser?.role || 'user'}</li>
    //               <li><strong>Clerk ID:</strong> {authUser?.clerkId || 'N/A'}</li>
    //             </ul>
    //           </div>
    //           <div className="border rounded-lg p-4">
    //             <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
    //             <div className="space-y-2">
    //               <button
    //                 onClick={createNewSession}
    //                 className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
    //                 Create New Session
    //               </button>
    //               <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
    //                 Join Existing Session
    //               </button>
    //               <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
    //                 View Your Snippets
    //               </button>
    //             </div>
    //           </div>

    //           {/* User's Sessions Section */}
    //           <div className="border-gray cursor-pointer rounded-lg p-4">
    //             <h3 className="text-lg font-medium text-gray-900 mb-2">Your Sessions</h3>
    //             {sessionsLoading ? (
    //               <div className="text-gray-500">Loading sessions...</div>
    //             ) : sessionsError ? (
    //               <div className="text-red-500">{sessionsError}</div>
    //             ) : sessions.length > 0 ? (
    //               <div className="space-y-2">
    //                 {sessions.map((session) => (
    //                   <div
    //                     key={session.sessionId}
    //                     className="flex justify-between items-center p-2 border rounded cursor-pointer hover:bg-gray-50"
    //                     onClick={() => navigate(`/session/${session.sessionId}`)}
    //                   >
    //                     <div>
    //                       <div className="font-medium">{session.title}</div>
    //                       <div className="text-xs text-gray-500">
    //                         {new Date(session.updatedAt).toLocaleString()} • {session.language}
    //                       </div>
    //                     </div>
    //                     <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
    //                       {session.isActive ? 'Active' : 'Inactive'}
    //                     </span>
    //                   </div>
    //                 ))}
    //               </div>
    //             ) : (
    //               <div className="text-gray-500">No sessions yet. Create your first session!</div>
    //             )}
    //           </div>
    //         </div>
    //       </div>
    //       </div>
    //     </main>

    //   </div>
    // </div>
  <div className="flex h-screen bg-gray-100">
    <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <nav className="bg-white border-b">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {authUser?.firstName || authUser?.username}
            </span>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Profile
            </button>
            <button
              onClick={async () => {
                localStorage.clear();
                await signOut();
                navigate('/login');
              }}
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Welcome Card */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome back 👋
            </h2>
            <p className="text-gray-600">
              Manage your sessions and collaborate in real-time.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* User Info */}
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold text-gray-800 mb-4">
                User Information
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><strong>Username:</strong> {authUser?.username}</li>
                <li><strong>Email:</strong> {authUser?.email}</li>
                <li><strong>Role:</strong> {authUser?.role}</li>
                <li><strong>Clerk ID:</strong> {authUser?.clerkId}</li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={createNewSession}
                  className="w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  New Session
                </button>
                
              </div>
            </div>

            {/* Sessions */}
            <div className="bg-white rounded-xl shadow p-5 md:col-span-2 lg:col-span-1">
              <h3 className="font-semibold text-gray-800 mb-4">
                Your Sessions
              </h3>

              {sessionsLoading && (
                <p className="text-sm text-gray-500">Loading...</p>
              )}

              {!sessionsLoading && sessions.length === 0 && (
                <p className="text-sm text-gray-500">
                  No sessions yet.
                </p>
              )}

              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.sessionId}
                    onClick={() => navigate(`/session/${s.sessionId}`)}
                    className="flex justify-between items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {s.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(s.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  </div>
);


};

export default Dashboard;