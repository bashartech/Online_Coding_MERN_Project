import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useUser } from '@clerk/clerk-react';
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
  onReceiveMessage
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [socketConnectionError, setSocketConnectionError] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [accessCode, setAccessCode] = useState<string>('');
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
        joinSession(sessionKey, user.id, (error, result) => {
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

      joinSession(sessionKey, user.id, (error, result) => {
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
  const handleCodeChange = useCallback((newValue: string | undefined, language: string, fileName: string) => {
    if (session && user) {
      try {
        // Update local state
        setSession(prev => prev ? {
          ...prev,
          code: newValue || '',
          language: language
        } : null);

        // Send real-time update to other users in the session using sessionKey
        console.log('Sending code change to session:', session.sessionKey, 'Code:', newValue?.substring(0, 50));
        if (isSocketConnected) {
          sendCodeChange(session.sessionKey, newValue || '', user.id, language);
        }
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
        setAccessCode(data.accessCode);
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Session not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Code Editor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col max-w-7xl mx-auto py-0 sm:px-0 lg:px-0">
        <div className="px-4 py-3 sm:px-0 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={session.title}
              onChange={handleTitleChange}
              className="text-xl font-semibold text-gray-900 bg-transparent border-none outline-none flex-1"
            />
            <div className="flex items-center space-x-4 ml-4">
              {/* Presence indicator */}
              {user && session && (
                <PresenceIndicator
                  sessionKey={session.sessionKey}
                  currentUserId={user.id}
                  onPresenceUpdate={setActiveUsers}
                />
              )}

              {/* Socket connection status indicator */}
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isSocketConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              {socketConnectionError && (
                <div className="text-sm text-red-500 ml-2" title={socketConnectionError}>
                  ⚠️ Connection Issue
                </div>
              )}
              <button
                onClick={() => setShowShareModal(true)}
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                Share Session
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`ml-2 px-4 py-2 text-sm font-medium text-white rounded-md ${
                  saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saving ? 'Saving...' : 'Save Code'}
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 p-0">
          <div className="h-[calc(100vh-150px)]">
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
      </main>

      {/* Chat Panel */}
      <ChatPanel
        currentUser={user ? {
          id: user.id,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          avatar: user.imageUrl
        } : null}
        sessionId={session.sessionKey}
        onSendMessage={handleSendMessage}
        messages={messages}
        activeUsers={activeUsers}
        isVisible={showChat}
        onClose={() => setShowChat(false)}
        onToggleChat={() => setShowChat(!showChat)}
      />

      {/* Share Session Modal */}
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