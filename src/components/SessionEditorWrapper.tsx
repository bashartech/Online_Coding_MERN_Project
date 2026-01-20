import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useUser } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';
import CodeEditor from './codeEditor';
import PresenceIndicator from './PresenceIndicator';
import apiClient from '../utils/api';
import {
  initSocket,
  joinSession,
  sendCodeChange,
  disconnectSocket,
  onCodeUpdate,
  onError,
  onConnect,
  onDisconnect,
  onConnectError,
  onPresenceUpdate,
  onPresenceList,
  onUserJoined,
  onUserLeft,
  sendMessage,
  onReceiveMessage,
  onLanguageUpdate,
  sendLanguageChange
} from '../services/socketService';
import ChatPanel from './ChatPanel';
import ShareSessionModal from './ShareSessionModal';

interface Session {
  sessionId: string;
  sessionKey: string;
  title: string;
  code: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

const SessionEditorWrapper: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session: clerkSession } = useSession();
  const { isSignedIn, user } = useUser(); // Get user info for socket connection
  const { user: authUser } = useAuth(); // Get our app's user data with role
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [socketConnectionError, setSocketConnectionError] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [generatingLink, setGeneratingLink] = useState<boolean>(false);
  const socketInitialized = useRef<boolean>(false);

  // Initialize socket infrastructure once when component mounts
  useEffect(() => {
    // Initialize socket connection
    initSocket(import.meta.env.VITE_BACKEND_URL);

    // Listen for code updates from other users
    onCodeUpdate((data) => {
      console.log('Received code-update:', data, 'Current session:', session?.sessionKey, 'Session available:', !!session);
      // Update whenever we receive a valid update (server already excludes sender)
      // We don't check if session exists here because we want to update when it becomes available
      console.log('Processing code update');
      setSession(prev => {
        if (!prev) {
          console.log('No session available to update');
          return null;
        }
        console.log('Setting new code:', data.code.substring(0, 50));
        return {
          ...prev,
          code: data.code,
          language: data.language
        };
      });
    });


    // Listen for socket errors
    onError((error) => {
      console.error('Socket error:', error);
      setSocketConnectionError(error.error || 'Socket connection error');
      setError(error.error || 'Socket connection error');
    });

    // Listen for connection events
    onConnect(() => {
      console.log('Socket reconnected');
      setIsSocketConnected(true);
      setSocketConnectionError(null);

      // Rejoin session after reconnection if session and user are available
      if (session && user) {
        const sessionKey = session.sessionKey; // Use the sessionKey from the session data
        joinSession(sessionKey, user.id, (error) => {
          if (error) {
            console.error('Error rejoining session:', error);
            setSocketConnectionError(error.error || 'Failed to rejoin session');
          } else {
            setSocketConnectionError(null);
          }
        });
      }
    });

    onDisconnect((reason) => {
      console.log('Socket disconnected:', reason);
      setIsSocketConnected(false);
      setSocketConnectionError('Disconnected from server');
    });

    onConnectError((error) => {
      console.error('Socket connection error:', error);
      setSocketConnectionError('Connection error occurred');
    });

    // Listen for presence updates
    onPresenceList((data) => {
      setActiveUsers(data.users);
    });

    onPresenceUpdate((data) => {
      setActiveUsers(data.users);
    });

    onUserJoined((data) => {
      console.log('User joined:', data);
      // The presence update will come through onPresenceUpdate
    });

    onUserLeft((data) => {
      console.log('User left:', data);
      // The presence update will come through onPresenceUpdate
    });

    // Listen for chat messages from all users (including self for immediate feedback)
    onReceiveMessage((data) => {
      console.log('Received chat message:', data);
      setMessages(prev => {
        // Check if this message is already in the state to prevent duplicates
        const messageExists = prev.some(msg => msg.messageId === data.messageId);
        if (!messageExists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    // Listen for language updates from other users (when they change language without changing code)
    onLanguageUpdate((data) => {
      console.log('Received language-update:', data);
      // Update the session language when another user changes it
      setSession(prev => {
        if (!prev || prev.sessionId !== session?.sessionId) {
          return prev;
        }
        return {
          ...prev,
          language: data.language
        };
      });
    });

    socketInitialized.current = true;

    // Clean up on component unmount
    return () => {
      if (socketInitialized.current) {
        disconnectSocket();
        socketInitialized.current = false;
        setIsSocketConnected(false);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Join session when session and user are available
  useEffect(() => {
    if (session && user && socketInitialized.current) {
      // Join the session using sessionKey for socket operations
      const sessionKey = session.sessionKey; // Use the sessionKey from the session data

      joinSession(sessionKey, user.id, (error) => {
        if (error) {
          console.error('Error joining session:', error);
          setSocketConnectionError(error.error || 'Failed to join session');
          setError(error.error || 'Failed to join session');
        } else {
          setIsSocketConnected(true);
          setSocketConnectionError(null);
          console.log('Successfully joined session:', sessionKey);
        }
      });
    }
  }, [session, user]); // Only run when session or user changes

  // Load session data on component mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        // Get the Clerk authentication token
        // Don't proceed if session is not ready
        if (!clerkSession) {
          setError('Session not authenticated. Please sign in again.');
          return;
        }

        // Check if user is actually authenticated via Clerk
        if (!isSignedIn) {
          setError('User not authenticated. Please sign in again.');
          return;
        }

        // Additional check: verify session status and user details
        console.log("Session details in loadSession:", {
          status: clerkSession?.status,
          id: clerkSession?.id,
          userId: clerkSession?.user?.id,
          lastActiveAt: clerkSession?.lastActiveAt
        });

        const token = clerkSession ? await clerkSession.getToken() : null;
        const response = await apiClient.get(`/api/sessions/${sessionId}`, token || undefined);

        if (response.ok) {
          const data = await response.json();
          setSession(data);
        } else if (response.status === 404) {
          setError('Session not found');
        } else if (response.status === 403) {
          setError('Access denied to this session');
          // Redirect to dashboard after a delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setError('Failed to load session');
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId, navigate, clerkSession, isSignedIn]);

  // Handle saving the code
  const handleSave = useCallback(async () => {
    if (!session) return;

    try {
      setSaving(true);
      // Don't proceed if session is not ready
      if (!clerkSession) {
        setError('Session not authenticated. Please sign in again.');
        return;
      }

      // Check if user is actually authenticated via Clerk
      if (!isSignedIn) {
        setError('User not authenticated. Please sign in again.');
        return;
      }

      // Additional check: verify session status and user details
      console.log("Session details in handleSave:", {
        status: clerkSession?.status,
        id: clerkSession?.id,
        userId: clerkSession?.user?.id,
        lastActiveAt: clerkSession?.lastActiveAt
      });

      // Get the Clerk authentication token
      const token = clerkSession ? await clerkSession.getToken() : null;
      const response = await apiClient.put(`/api/sessions/${session.sessionId}`, {
        code: session.code,
        language: session.language,
        title: session.title,
      }, token || undefined);

      if (response.ok) {
        alert('Session saved successfully!');

        // Refresh session data to update the updatedAt timestamp
        // Don't proceed if session is not ready
        if (!clerkSession) {
          setError('Session not authenticated. Please sign in again.');
          return;
        }

        // Check if user is actually authenticated via Clerk
        if (!isSignedIn) {
          setError('User not authenticated. Please sign in again.');
          return;
        }

        // Additional check: verify session status and user details
        console.log("Session details in refresh:", {
          status: clerkSession?.status,
          id: clerkSession?.id,
          userId: clerkSession?.user?.id,
          lastActiveAt: clerkSession?.lastActiveAt
        });

        const updatedToken = clerkSession ? await clerkSession.getToken() : null;
        const updatedResponse = await apiClient.get(`/api/sessions/${session.sessionId}`, updatedToken || undefined);

        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          setSession(updatedData);
        }
      } else if (response.status === 403) {
        setError('Access denied');
        navigate('/dashboard');
      } else {
        alert('Failed to save session');
      }
    } catch (err) {
      console.error('Error saving session:', err);
      alert('Error saving session');
    } finally {
      setSaving(false);
    }
  }, [session, navigate]);

  // Handle code changes from the editor
  const handleCodeChange = useCallback((newValue: string | undefined, language: string) => {
    if (session && user) {
      try {
        // Update local state
        setSession(prev => prev ? {
          ...prev,
          code: newValue || '',
          language: language
        } : null);

        // Update local state first
        setSession(prev => {
          if (!prev) return null;

          // Determine if code or language changed
          const codeChanged = prev.code !== (newValue || '');
          const languageChanged = prev.language !== language;

          // Send appropriate update to other users
          if (isSocketConnected) {
            console.log('Sending update to session:', prev.sessionKey, 'Code changed:', codeChanged, 'Language changed:', languageChanged, 'Code excerpt:', newValue?.substring(0, 50), 'Language:', language);

            if (codeChanged) {
              // Send code change which includes language
              sendCodeChange(prev.sessionKey, newValue || '', user.id, language);
            } else if (languageChanged) {
              // Only language changed, send language change event
              sendLanguageChange(prev.sessionKey, user.id, language);
            } else if (!codeChanged && !languageChanged) {
              // No changes, but still update if needed for synchronization
              sendCodeChange(prev.sessionKey, newValue || '', user.id, language);
            }
          }

          // Return updated session
          return {
            ...prev,
            code: newValue || '',
            language: language
          };
        });
      } catch (error) {
        console.error('Error in handleCodeChange:', error);
      }
    }
  }, [session, user, isSocketConnected]);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (session) {
      setSession({
        ...session,
        title: e.target.value
      });
    }
  };

  // Handle sending a chat message
  const handleSendMessage = (message: string) => {
    if (session && user && isSocketConnected) {
      sendMessage(session.sessionKey, user.id, message);
    }
  };

  // Handle generating a share link
  const handleGenerateLink = async (): Promise<string> => {
    if (!session || !user) {
      throw new Error('Session or user not available');
    }

    setGeneratingLink(true);
    try {
      // Get the Clerk authentication token
      const token = clerkSession ? await clerkSession.getToken() : null;

      const response = await apiClient.post(
        `/api/sessions/${session.sessionId}/generate-access-code`,
        {},
        token || undefined
      );

      if (response.ok) {
        const data = await response.json();
        return data.accessCode;
      } else {
        throw new Error('Failed to generate access code');
      }
    } catch (error) {
      console.error('Error generating access code:', error);
      throw error;
    } finally {
      setGeneratingLink(false);
    }
  };
if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-gray-100">
        {/* Header */}
        <header className="bg-gray-900 shadow-md h-14 flex items-center px-4 sm:px-6 md:px-8 justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-white">Code Editor</h1>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-gray-700 rounded-md" disabled>
              Dashboard
            </button>
          </div>
        </header>

        {/* Loading State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-gray-900 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-spin"></div>
              </div>
            </div>
            <div className="text-xl font-medium text-white mb-2">Loading Session</div>
            <div className="text-gray-400">Connecting to the coding environment...</div>
            <div className="mt-4 w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-gray-100">
        {/* Header */}
        <header className="bg-gray-900 shadow-md h-14 flex items-center px-4 sm:px-6 md:px-8 justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-white">Code Editor</h1>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={() => navigate('/dashboard')} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 transition">
              Dashboard
            </button>
          </div>
        </header>

        {/* Error State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="text-2xl font-bold text-red-500 mb-4">Error Loading Session</div>
            <div className="text-gray-400 mb-2">Something went wrong while loading the session:</div>
            <div className="text-red-400 mb-6 text-center break-words max-w-md">{error}</div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-md transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-gray-100">
        {/* Header */}
        <header className="bg-gray-900 shadow-md h-14 flex items-center px-4 sm:px-6 md:px-8 justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-white">Code Editor</h1>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={() => navigate('/dashboard')} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 transition">
              Dashboard
            </button>
          </div>
        </header>

        {/* Session Not Found State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="text-2xl font-bold text-red-500 mb-4">Session Not Found</div>
            <div className="text-gray-400 mb-6">The session you're looking for doesn't exist or may have expired.</div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-md transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }




 return (
  <div className="min-h-screen flex flex-col bg-black text-gray-100">
    {/* Header */}
    <header className="bg-gray-900 shadow-md h-14 flex items-center px-4 sm:px-6 md:px-8 justify-between">
      <h1 className="text-base sm:text-lg font-semibold text-white">Code Editor</h1>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button onClick={() => navigate('/profile')} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition">Profile</button>
        {authUser?.role === 'admin' && <button onClick={() => navigate('/admin')} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition">Admin</button>}
        <button onClick={() => navigate('/dashboard')} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 transition">Dashboard</button>
      </div>
    </header>

    {/* Session Details */}
    <div className="bg-gray-850 border-b border-gray-800 px-4 sm:px-6 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
      {/* Title */}
      <input
        type="text"
        value={session.title}
        onChange={handleTitleChange}
        placeholder="Session Title..."
        className="flex-1 max-w-full md:max-w-md text-base sm:text-lg font-semibold text-white bg-gray-800 px-2 sm:px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
      />

      {/* Status and Actions */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {user && (
          <PresenceIndicator
            sessionKey={session.sessionKey}
            currentUserId={user.id}
            onPresenceUpdate={setActiveUsers}
          />
        )}

        {/* Socket Status */}
        <div className="flex items-center space-x-1 text-xs sm:text-sm">
          <div
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isSocketConnected ? 'Connected' : 'Disconnected'}
          ></div>
          <span className={`${isSocketConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isSocketConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        {/* Error */}
        {socketConnectionError && <div className="text-xs sm:text-sm text-red-500 ml-1" title={socketConnectionError}>⚠️</div>}

        {/* Share */}
        <button
          onClick={() => setShowShareModal(true)}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition"
        >
          Share
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white rounded-md transition-transform transform hover:scale-105 ${
            saving ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>

    {/* Main Content: Chat 30% / Editor 70% */}
    <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
      {/* Chat Panel */}
      <div className="w-full md:w-[30%] bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 p-2 overflow-y-auto">
        <ChatPanel
          currentUser={user ? { id: user.id, firstName: user.firstName || undefined, lastName: user.lastName || undefined, avatar: user.imageUrl } : null}
          sessionId={session.sessionKey}
          onSendMessage={handleSendMessage}
          messages={messages}
          activeUsers={activeUsers}
          isVisible={true}
          onClose={() => {}}
          onToggleChat={() => {}}
          layoutMode="embedded"
        />
      </div>

      {/* Code Editor */}
      <div className="w-full md:w-[70%] bg-gray-950 flex flex-col border-l md:border-l-0 border-gray-800">
        <CodeEditor
          initialCode={session.code}
          initialLanguage={session.language}
          onCodeChange={handleCodeChange}
          height="100%"
          theme="vs-dark"
          codeValue={session.code}
          languageValue={session.language}
        />
      </div>
    </div>

    {/* Share Modal */}
    <ShareSessionModal
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
      sessionId={session.sessionId}
      onGenerateLink={handleGenerateLink}
      isLoading={generatingLink}
    />
  </div>
);




};

export default SessionEditorWrapper;