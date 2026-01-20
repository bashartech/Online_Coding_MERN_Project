import React, { useState, useEffect } from 'react';
import { useUser, useSession } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
    const { user: clerkUser,isSignedIn, isLoaded: clerkLoaded } = useUser();
  const { session } = useSession();
  const { user: authUser, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
  
  // Fetch user's owned sessions
  useEffect(() => {
    const fetchUserSessions = async () => {
      if (!clerkUser || !clerkUser.id) return;

      try {
        setLoading(true);
        setError(null);

        const token = session ? await session.getToken() : null;
        const response = await apiClient.get('/api/sessions', token || undefined);

        if (response.ok) {
          const sessionsData = await response.json();
          setSessions(sessionsData);
        } else {
          throw new Error('Failed to load sessions');
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load your sessions');
      } finally {
        setLoading(false);
      }
    };

    if (clerkLoaded && clerkUser && session) {
      fetchUserSessions();
    }
  }, [clerkUser, clerkLoaded, session]);

  const handleLogout = () => {
    // Clerk handles logout, but we should also clear our app's authentication state
    // In Clerk, logout is handled by the ClerkProvider, so we'll redirect to home/login
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#0B0F14] via-[#0D1117] to-[#0B0F14] text-white overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 shadow-md h-14 flex items-center px-4 sm:px-6 md:px-8 justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-white">Profile</h1>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={() => navigate('/dashboard')} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 transition">
              Dashboard
            </button>
          </div>
        </header>

        <div className="flex justify-center items-center min-h-[calc(100vh-56px)]">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-[#0B0F14] flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-spin"></div>
              </div>
            </div>
            <div className="text-lg font-medium text-gray-300">Loading your profile</div>
            <div className="mt-2 text-sm text-gray-500">Retrieving your personal information...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!clerkUser && clerkLoaded) {
    navigate('/login'); // Redirect to login if not authenticated
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      {/* Profile Header */}
      <header className="bg-[#0D1117] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                {authUser?.username || authUser?.email || clerkUser?.username || clerkUser?.emailAddresses?.[0]?.emailAddress}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-[#0D1117] border border-gray-800 rounded-lg p-6">
            {/* User Profile Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-white mb-4">Personal Information</h2>

              <div className="flex items-center mb-6">
                {clerkUser?.imageUrl ? (
                  <img
                    src={clerkUser.imageUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mr-4">
                    <span className="text-gray-300 text-xl">
                      {clerkUser?.firstName?.charAt(0) || clerkUser?.lastName?.charAt(0) || '?'}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-white">
                    {clerkUser?.firstName && clerkUser?.lastName
                      ? `${clerkUser.firstName} ${clerkUser.lastName}`
                      : clerkUser?.username || clerkUser?.emailAddresses?.[0]?.emailAddress || 'Anonymous User'}
                  </h3>
                  <p className="text-gray-400">
                    {clerkUser?.emailAddresses?.[0]?.emailAddress || 'No email provided'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Member since {clerkUser?.createdAt ? new Date(clerkUser.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Profile Edit Section (Optional) */}
            </div>

            {/* Owned Sessions Section */}
            <div>
              <h2 className="text-lg font-medium text-white mb-4">Your Sessions</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-md">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <p>Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">You don't have any sessions yet.</p>
                  <button
                    onClick={createNewSession}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-md hover:from-blue-600 hover:to-cyan-600"
                  >
                    Create Your First Session
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">
                          Title
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Language
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">
                          Last Updated
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 bg-[#0D1117]">
                      {sessions.map((session) => (
                        <tr key={session.sessionId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                            {session.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                            {session.language}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                            {new Date(session.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => navigate(`/session/${session.sessionId}`)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              View<span className="sr-only">, {session.title}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;