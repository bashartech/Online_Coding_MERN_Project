import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useUser } from '@clerk/clerk-react';
import CodeEditor from './codeEditor';
import apiClient from '../utils/api';

interface Session {
  sessionId: string;
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
  const { isSignedIn } = useUser();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

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
  }, [sessionId, navigate]);

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
    if (session) {
      setSession(prev => prev ? {
        ...prev,
        code: newValue || '',
        language: language
      } : null);
    }
  }, [session]);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (session) {
      setSession({
        ...session,
        title: e.target.value
      });
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
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
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
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionEditorWrapper;