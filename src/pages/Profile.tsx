import React, { useState, useEffect } from 'react';
import { useUser, useSession } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { session } = useSession();
  const { user: authUser, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!clerkUser && clerkLoaded) {
    navigate('/login'); // Redirect to login if not authenticated
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
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
          <div className="bg-white shadow rounded-lg p-6">
            {/* User Profile Section */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>

              <div className="flex items-center mb-6">
                {clerkUser?.imageUrl ? (
                  <img
                    src=""
                    alt="Profile"
                    className="w-2 h-2 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    <span className="text-gray-600 text-xl">
                      {clerkUser?.firstName?.charAt(0) || clerkUser?.lastName?.charAt(0) || '?'}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {clerkUser?.firstName && clerkUser?.lastName
                      ? `${clerkUser.firstName} ${clerkUser.lastName}`
                      : clerkUser?.username || clerkUser?.emailAddresses?.[0]?.emailAddress || 'Anonymous User'}
                  </h3>
                  <p className="text-gray-600">
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
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Sessions</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <p>Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">You don't have any sessions yet.</p>
                  <button
                    onClick={() => navigate('/editor')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Your First Session
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Title
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Language
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Last Updated
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {sessions.map((session) => (
                        <tr key={session.sessionId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {session.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {session.language}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(session.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => navigate(`/session/${session.sessionId}`)}
                              className="text-blue-600 hover:text-blue-900"
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