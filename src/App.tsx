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
    return <div>Loading...</div>; // Or a spinner component
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
    return <div>Loading...</div>; // Or a spinner component
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
