'use client';

import React from "react"

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
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-700 h-14 flex items-center px-4 sm:px-6 md:px-8 justify-between">
          {/* <h1 className="text-base sm:text-lg font-bold text-slate-100">Code Collaboration</h1> */}
          <p className="text-base sm:text-lg font-bold text-slate-100">Code Collaboration</p>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 bg-slate-700 rounded-lg" disabled>
              Dashboard
            </button>
          </div>
        </header>

        {/* Loading State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
            </div>
            <div className="text-lg font-semibold text-slate-100 mb-2">Loading Session</div>
            <div className="text-slate-400 text-sm">Initializing editor and connections...</div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-700 h-14 flex items-center px-4 sm:px-6 md:px-8 justify-between">
          {/* <h1 className="text-base sm:text-lg font-bold text-slate-100">Code Collaboration</h1> */}
          <p className="text-base sm:text-lg font-bold text-slate-100">Code Collaboration</p>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={() => navigate('/dashboard')} className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              Dashboard
            </button>
          </div>
        </header>

        {/* Error State */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center text-center max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="text-xl font-bold text-red-400 mb-2">Session Error</div>
            <div className="text-slate-400 mb-4 text-sm">{error}</div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-700 h-14 flex items-center px-4 sm:px-6 md:px-8 justify-between">
          {/* <h1 className="text-base sm:text-lg font-bold text-slate-100">Code Collaboration</h1> */}
          <p className="text-base sm:text-lg font-bold text-slate-100">Code Collaboration</p>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={() => navigate('/dashboard')} className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              Dashboard
            </button>
          </div>
        </header>

        {/* Session Not Found State */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center text-center max-w-md">
            <div className="text-4xl mb-4">🔍</div>
            <div className="text-xl font-bold text-slate-100 mb-2">Session Not Found</div>
            <div className="text-slate-400 mb-6 text-sm">This session doesn't exist or may have expired.</div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }




 return (
  <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
    {/* Main Header */}
    <header className="bg-slate-900 border-b border-slate-700 h-16 flex items-center px-4 sm:px-6 md:px-8 justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* <h1 className="text-lg sm:text-xl font-bold text-white">Code Collaboration</h1> */}
        <p className="text-base sm:text-lg font-bold text-slate-100">Code Collaboration</p>
        <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-slate-700">
          <div className={`w-2.5 h-2.5 rounded-full ${isSocketConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-slate-400">{isSocketConnected ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/profile')} className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">Profile</button>
        {authUser?.role === 'admin' && <button onClick={() => navigate('/admin')} className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Admin</button>}
        <button onClick={() => navigate('/dashboard')} className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-100 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">Dashboard</button>
      </div>
    </header>

    {/* Session Info Bar */}
    <div className="bg-slate-900 border-b border-slate-700 px-4 sm:px-6 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: Title and Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <input
          type="text"
          value={session.title}
          onChange={handleTitleChange}
          placeholder="Session Title..."
          className="text-lg sm:text-xl font-bold text-slate-100 bg-transparent border-0 border-b-2 border-slate-700 focus:border-blue-500 focus:outline-none px-0 py-1 placeholder-slate-600 transition-colors"
        />
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span>Created: {new Date(session.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>Updated: {new Date(session.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Right: Status and Actions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-start sm:justify-end">
        {/* Presence Indicator */}
        {user && (
          <PresenceIndicator
            sessionKey={session.sessionKey}
            currentUserId={user.id}
            onPresenceUpdate={setActiveUsers}
          />
        )}

        {/* Error Warning */}
        {socketConnectionError && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-900 bg-opacity-30 border border-red-700 text-red-400 text-xs" title={socketConnectionError}>
            <span>⚠️</span>
            <span className="hidden sm:inline">Connection Error</span>
          </div>
        )}

        {/* Share Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Share
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
            saving ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>

    {/* Main Content: Editor 70% / Chat 30% */}
    <div className="flex flex-1 flex-col-reverse md:flex-row overflow-hidden bg-slate-950">
      {/* Chat Panel - Right side */}
      <div className="w-full md:w-[30%] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-700 overflow-hidden flex flex-col">
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

      {/* Code Editor - Left side */}
      <div className="w-full md:w-[70%] bg-slate-950 flex flex-col overflow-hidden">
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
