import { SignUp } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Code2 } from 'lucide-react';
import { useEffect } from 'react';

const Signup: React.FC = () => {
  const { isAuthenticated, loading, isClerkLoaded} = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated and not loading
  useEffect(() => {
    if (isClerkLoaded && !loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, isClerkLoaded, navigate]);

  // Show loading state while checking authentication
  if (!isClerkLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F14] via-[#0D1117] to-[#0B0F14] text-white overflow-hidden">
        {/* Navigation */}
        <nav className="pt-6 pb-12 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Code2 size={20} className="text-white" />
              </div>
              <span className="font-bold text-lg">CodeCollab</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-gray-300 hover:text-white transition px-4 py-2 rounded-md">
                Sign In
              </Link>
              <Link to="/signup" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 px-4 py-2 rounded-md text-sm transition">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-[#0B0F14] flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-spin"></div>
              </div>
            </div>
            <div className="text-lg font-medium text-gray-300">Setting up your account</div>
            <div className="mt-2 text-sm text-gray-500">Preparing your secure workspace...</div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-8 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-gray-500">© 2025 CodeCollab. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // If user is already authenticated, don't show the signup form
  if (isClerkLoaded && !loading && isAuthenticated) {
    return null; // The redirect will handle navigation
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0F14] via-[#0D1117] to-[#0B0F14] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="pt-6 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Code2 size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg">CodeCollab</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-300 hover:text-white transition px-4 py-2 rounded-md">
              Sign In
            </Link>
            <Link to="/signup" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 px-4 py-2 rounded-md text-sm transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex justify-center items-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Create your account</h1>
            <p className="text-gray-400">Start coding together in real-time</p>
          </div>

          <div className="bg-[#0D1117] rounded-xl border border-gray-700 p-6">
            <SignUp
              path="/signup"
              routing="path"
              appearance={{
                elements: {
                  card: "bg-transparent shadow-none",
                  headerTitle: "text-xl font-semibold hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border border-gray-600 hover:bg-gray-800 bg-transparent text-white w-full justify-center my-2",
                  socialButtonsBlockButtonText: "text-white",
                  formFieldInput: "border-gray-600 bg-[#0B0F14] text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 focus:ring-blue-500",
                  footerActionLink: "text-blue-400 hover:text-blue-300",
                  formButtonPrimary: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 py-3",
                  dividerText: "text-gray-500",
                  formFieldLabel: "text-gray-300",
                  formHeaderTitle: "text-white",
                  formHeaderSubtitle: "text-gray-400",
                  formFieldInputShowPasswordButton: "text-gray-400 hover:text-white"
                }
              }}
              signInUrl="/login"
              fallbackRedirectUrl="/dashboard"
            />
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-500">© 2025 CodeCollab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
