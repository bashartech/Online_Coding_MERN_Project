import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import axios from 'axios';

// Define TypeScript types
interface UserType {
  _id?: string;
  clerkId: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
  isActive?: boolean;
  lastLoginAt?: Date;
  preferences?: {
    theme?: string;
    fontSize?: number;
    language?: string;
  };
}

interface AuthContextType {
  user: UserType | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isClerkLoaded: boolean;
  clerkUser: any;
  isClerkSignedIn: boolean;
  hasBackendSyncFailed: boolean;
  isBackendSyncInProgress: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useClerkAuth();
  const [authUser, setAuthUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [hasCheckedInitialToken, setHasCheckedInitialToken] = useState<boolean>(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [hasBackendSyncFailed, setHasBackendSyncFailed] = useState<boolean>(false);
  const [isBackendSyncInProgress, setIsBackendSyncInProgress] = useState<boolean>(false);

  // Function to sync Clerk user with MongoDB
  const syncUserWithBackend = async () => {
    if (user && isSignedIn) {
      setIsBackendSyncInProgress(true); // Mark sync as in progress

      try {
        // Get the Clerk JWT token
        const clerkToken = await getToken();

        if (!clerkToken) {
          console.error('No Clerk token available');
          return;
        }

        // Send Clerk JWT to backend to sync user
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`, {}, {
          headers: {
            'Authorization': `Bearer ${clerkToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          // Store the internal JWT token returned by backend
          if (response.data.token) {
            setToken(response.data.token);
            localStorage.setItem('token', response.data.token);

            // Set default authorization header for all subsequent requests
            axios.defaults.headers.common['x-auth-token'] = response.data.token;
          }

          setAuthUser(response.data.user);
          setHasBackendSyncFailed(false); // Reset the failure flag on success

          // Store the user data in localStorage if needed
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (error: any) {
        console.error('Error syncing user with backend:', error);

        // Check if this is specifically a 401 error from the backend
        if (error.response?.status === 401) {
          // This means the Clerk token is valid but backend verification failed
          // Set the flag to indicate backend sync failed
          setHasBackendSyncFailed(true);

          // We should still allow the user to be authenticated with Clerk
          // Just use the Clerk user data as fallback
          const fallbackUser: UserType = {
            _id: undefined,
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            username: user.username || user.primaryEmailAddress?.emailAddress.split('@')[0] || user.id.substring(0, 15),
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            avatar: user.imageUrl || '',
            role: 'user'
          };

          // Only update authUser if we don't already have one
          // This prevents overriding a valid user with a fallback
          if (!authUser) {
            setAuthUser(fallbackUser);
          }
        } else {
          // For other errors, set the flag to indicate backend sync failed
          setHasBackendSyncFailed(true);

          // For other errors, still set a fallback user to prevent hanging loading state
          const fallbackUser: UserType = {
            _id: undefined,
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            username: user.username || user.primaryEmailAddress?.emailAddress.split('@')[0] || user.id.substring(0, 15),
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            avatar: user.imageUrl || '',
            role: 'user'
          };

          if (!authUser) {
            setAuthUser(fallbackUser);
          }
        }
      } finally {
        setIsBackendSyncInProgress(false); // Mark sync as completed (success or failure)
      }
    } else if (!isSignedIn) {
      // User is signed out, clear auth state
      setToken(null);
      setAuthUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['x-auth-token'];
      setIsBackendSyncInProgress(false); // Reset sync state on sign out
    }
  };

  // Verify token and get user info
  const verifyToken = async () => {
    if (token && hasCheckedInitialToken === false) {
      setIsBackendSyncInProgress(true); // Mark sync as in progress

      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify`, {
          headers: {
            'x-auth-token': token,
          }
        });

        if (response.data.success) {
          setAuthUser(response.data.user);
          setHasBackendSyncFailed(false); // Reset the failure flag on success
        } else {
          // Token invalid, clear it
          setToken(null);
          setAuthUser(null);
          setHasBackendSyncFailed(true); // Indicate that backend sync failed
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['x-auth-token'];
        }
      } catch (error: any) {
        console.error('Error verifying token:', error);

        // Check if this is specifically a 401 error from the backend
        if (error.response?.status === 401) {
          // This means the stored token is invalid/expired, but the user might still be signed in with Clerk
          // Set the flag to indicate backend sync failed
          setHasBackendSyncFailed(true);

          // Don't clear the token immediately - let's try to get a new one by syncing with backend
          // For now, set a fallback user based on Clerk data to prevent hanging loading state
          const fallbackUser: UserType = {
            _id: undefined,
            clerkId: user?.id || '',
            email: user?.primaryEmailAddress?.emailAddress || '',
            username: user?.username || user?.primaryEmailAddress?.emailAddress.split('@')[0] || user?.id?.substring(0, 15) || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            avatar: user?.imageUrl || '',
            role: 'user'
          };

          // Only update authUser if we don't already have one
          if (!authUser) {
            setAuthUser(fallbackUser);
          }
        } else {
          // For other errors, set the flag to indicate backend sync failed
          setHasBackendSyncFailed(true);

          // For other errors, set a fallback user to prevent hanging loading state
          const fallbackUser: UserType = {
            _id: undefined,
            clerkId: user?.id || '',
            email: user?.primaryEmailAddress?.emailAddress || '',
            username: user?.username || user?.primaryEmailAddress?.emailAddress.split('@')[0] || user?.id?.substring(0, 15) || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            avatar: user?.imageUrl || '',
            role: 'user'
          };

          if (!authUser) {
            setAuthUser(fallbackUser);
          }
        }
      } finally {
        setIsBackendSyncInProgress(false); // Mark sync as completed
      }
    }
    setHasCheckedInitialToken(true);
    setLoading(false);
  };

  // Effect to handle initial token verification (only once)
  useEffect(() => {
    if (isLoaded === true && hasCheckedInitialToken === false) {
      if (token) {
        verifyToken(); // Verify existing token
      } else {
        setHasCheckedInitialToken(true);
        setInitialLoadComplete(true);
        setLoading(false);
      }
    }
  }, [isLoaded, token, hasCheckedInitialToken]);

  // Effect to handle Clerk authentication state changes
  useEffect(() => {
    if (isLoaded === true && isSignedIn === true) {
      // Sync user with backend when user signs in
      // Always sync when signing in to ensure latest user data
      syncUserWithBackend();
    } else if (isLoaded === true && isSignedIn === false) {
      setToken(null);
      setAuthUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['x-auth-token'];
      setHasCheckedInitialToken(false); // Reset to allow re-verification on next login
      setInitialLoadComplete(false); // Reset the initial load state
    }

    // Once isLoaded is true and we've checked the initial token, mark initial load as complete
    if (isLoaded === true && hasCheckedInitialToken && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [user, isSignedIn, isLoaded, hasCheckedInitialToken, initialLoadComplete]);

  const value = {
    user: authUser,
    token,
    loading,
    // User is authenticated if user data and token exist AND backend sync was successful
    // During sync in progress, we'll consider the user authenticated if they're signed in with Clerk
    isAuthenticated: !!authUser && !!token && !hasBackendSyncFailed,
    isClerkLoaded: !!isLoaded,
    clerkUser: user,
    isClerkSignedIn: !!isSignedIn,
    hasBackendSyncFailed,
    isBackendSyncInProgress
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};