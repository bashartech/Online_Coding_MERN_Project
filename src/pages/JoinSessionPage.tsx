import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import apiClient from '../utils/api';

const JoinSessionPage: React.FC = () => {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  const { user: clerkUser, isSignedIn } = useUser();
  const { signOut } = useClerkAuth();

  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<boolean>(false);

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        setLoadingSession(true);
        setError(null);

        const response = await apiClient.get(`/api/sessions/access/${accessCode}`);

        if (response.ok) {
          const data = await response.json();
          setSessionInfo(data);
        } else if (response.status === 404) {
          setError('Session not found or access code invalid');
        } else {
          setError('Failed to load session information');
        }
      } catch (err) {
        console.error('Error fetching session info:', err);
        setError('Error connecting to server');
      } finally {
        setLoadingSession(false);
      }
    };

    if (accessCode) fetchSessionInfo();
  }, [accessCode]);

  const handleJoinSession = () => {
    if (!sessionInfo) {
      setError('No session information available');
      return;
    }
    if (!isSignedIn) {
      setError('You must be logged in to join a session');
      return;
    }

    setJoining(true);
    navigate(`/session/${sessionInfo.sessionId}`);
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F14] via-[#0D1117] to-[#0B0F14] text-white overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 shadow-md h-14 flex items-center px-4 sm:px-6 md:px-8 justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-white">Join Session</h1>
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
            <div className="text-lg font-medium text-gray-300">Loading session details</div>
            <div className="mt-2 text-sm text-gray-500">Verifying access code and retrieving session info...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center animate-fadeIn">
          <div className="text-red-500 text-3xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!sessionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center animate-fadeIn">
          <div className="text-yellow-500 text-3xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-6">The session you're trying to join doesn't exist or the access code is invalid.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full animate-slideUp">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Session</h1>
          <p className="text-gray-600 mt-2">You've been invited to a coding session</p>
        </div>

        {/* Session Info Card */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="font-semibold text-gray-800 mb-2 truncate">{sessionInfo.title}</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Owner:</span> {sessionInfo.ownerId}</p>
            <p><span className="font-medium">Participants:</span> {sessionInfo.collaborators?.length + 1 || 1} / {sessionInfo.maxParticipants}</p>
            <p><span className="font-medium">Access Code:</span> {accessCode}</p>
          </div>
        </div>

        {/* Join / Sign-in Buttons */}
        {!isSignedIn ? (
          <div className="mb-6 text-center">
            <p className="text-gray-600 mb-4">You need to sign in to join this session</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              Sign In to Join
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleJoinSession}
              disabled={joining}
              className={`w-full px-4 py-2 text-white rounded-md font-medium transition-transform transform ${
                joining ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
              }`}
            >
              {joining ? 'Joining Session...' : 'Join Session'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-transform transform hover:scale-105"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Signed-in User Info */}
        {isSignedIn && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Signed in as:</p>
            <div className="flex items-center justify-center">
              {clerkUser?.imageUrl && (
                <img src={clerkUser.imageUrl} alt="Avatar" className="w-8 h-8 rounded-full mr-2" />
              )}
              <span className="text-sm font-medium text-gray-800">
                {clerkUser?.fullName || clerkUser?.emailAddresses?.[0]?.emailAddress || 'User'}
              </span>
            </div>
            <button
              onClick={async () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                await signOut();
                navigate('/login');
              }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 transition-transform transform hover:scale-105"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinSessionPage;
