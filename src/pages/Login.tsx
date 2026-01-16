import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

const Login: React.FC = () => {
  const { isAuthenticated, loading, isClerkLoaded, hasBackendSyncFailed, isBackendSyncInProgress } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated and not loading
  useEffect(() => {
    if (isClerkLoaded && !loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, isClerkLoaded, navigate]);

  // If user is already authenticated, don't show the login form
  if (isClerkLoaded && !loading && isAuthenticated) {
    return null; // The redirect will handle navigation
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
        </div>
        <div className="mt-8">
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/signup"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                card: "shadow-none border border-gray-200",
                headerTitle: "text-xl font-semibold",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50",
                formFieldInput: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                footerActionLink: "text-blue-600 hover:text-blue-800"
              }
            }}
          />
        </div>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
