import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import './index.css'
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SessionEditor from "./pages/session/[sessionId]";
import JoinSessionPage from "./pages/JoinSessionPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const {  loading, isClerkLoaded, isClerkSignedIn, hasBackendSyncFailed } = useAuth();

  if (!isClerkLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F14] via-[#0D1117] to-[#0B0F14] text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-[#0B0F14] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-spin"></div>
            </div>
          </div>
          <div className="text-lg font-medium text-gray-300">Securing your access</div>
          <div className="mt-2 text-sm text-gray-500">Verifying your authentication...</div>
        </div>
      </div>
    ); // Or a spinner component
  }

  // User is considered authorized if they are signed in with Clerk
  // This prevents redirect loops during backend sync
  // The dashboard will handle incomplete sync states separately
  const isAuthorized = isClerkSignedIn && !hasBackendSyncFailed;

  return isAuthorized ? children : <Navigate to="/login" replace />;
};

// Wrapper component to access auth context
const AppContent: React.FC = () => {
  const { isClerkLoaded,  loading } = useAuth();

  if (!isClerkLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F14] via-[#0D1117] to-[#0B0F14] text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-[#0B0F14] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 animate-spin"></div>
            </div>
          </div>
          <div className="text-lg font-medium text-gray-300">Starting application</div>
          <div className="mt-2 text-sm text-gray-500">Loading your workspace...</div>
        </div>
      </div>
    ); // Or a spinner component
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login/*" element={<Login />} />
      <Route path="/signup/*" element={<Signup />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/session/:sessionId" element={
        <ProtectedRoute>
          <SessionEditor />
        </ProtectedRoute>
      } />
      <Route path="/session/join/:accessCode" element={<JoinSessionPage />} />
      <Route path="/admin" element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
