
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import UserManagement from '../components/UserManagement';
import SessionManagement from '../components/SessionManagement';
import ReportsManagement from '../components/ReportsManagement';
import AdminSidebar from '../components/AdminSidebar';
import {
  initSocket,
  joinAdminRoom,
  onAdminNotification,
  onAdminStatsUpdate,
  onAdminJoined,
  disconnectSocket
} from '../services/socketService';

type AdminTab = 'users' | 'sessions' | 'stats' | 'reports';

interface User { _id: string; clerkId: string; username: string; firstName: string; lastName: string; role: string; isActive: boolean; avatar: string; email: string; createdAt: string; }

interface Session { _id: string; sessionKey: string; title: string; ownerId: string; language: string; isActive: boolean; createdAt: string; updatedAt: string; }

interface Report { _id: string; reporterId: string; reportedUserId: string; reason: string; description: string; status: 'pending'|'reviewed'|'resolved'|'dismissed'; createdAt: string; updatedAt: string; }

interface Stats {
  users: {
    total: number;
    active: number;
    admins: number;
  };
  sessions: {
    total: number;
    active: number;
  };
  messages?: {
    recent30Days: number;
  };
  snippets?: {
    total: number;
  };
}



const AdminDashboard: React.FC = () => {
  const { user: clerkUser, isSignedIn } = useUser();
  const { user: authUser, token: authToken, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Active tab state
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [socketConnectionError, setSocketConnectionError] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Redirect non-admin users
  useEffect(() => {
    if (authUser && authUser.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [authUser]);

  // Fetch admin data
  useEffect(() => {
    const fetchData = async () => {
      if (!isSignedIn || !authUser || authUser.role !== 'admin') return;

      try {
        setLoading(true);
        setError(null);

        const token = authToken;
        if (!token) throw new Error('Authentication token could not be retrieved');

        const [usersRes, sessionsRes, statsRes, reportsRes] = await Promise.all([
          apiClient.admin.getUsers(1, 50, undefined, undefined, token),
          apiClient.admin.getSessions(1, 50, undefined, undefined, token),
          apiClient.admin.getStats(token),
          apiClient.admin.getReports ? apiClient.admin.getReports(1, 50, undefined, undefined, token) : Promise.resolve({ ok: true, json: async () => ({ data: [] }) })
        ]);

        if (usersRes.ok) setUsers((await usersRes.json()).data || []);
        if (sessionsRes.ok) setSessions((await sessionsRes.json()).data || []);
        if (statsRes.ok) setStats((await statsRes.json()).data);
        if (reportsRes.ok) setReports((await reportsRes.json()).data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn, authUser, authToken]);

  // Socket initialization for real-time monitoring
  useEffect(() => {
    if (isSignedIn && authUser?.role === 'admin' && clerkUser && authToken) {
      initSocket(import.meta.env.VITE_BACKEND_URL || 'https://bashartc14-online-cod-collab.hf.space/');
      joinAdminRoom(clerkUser.id);

      onAdminNotification((data) => {
        setAdminNotifications(prev => [data, ...prev.slice(0, 9)]);
      });

      onAdminStatsUpdate((data) => {
        setStats((prev:any) => ({
          ...prev,
          users: { ...prev?.users, total: data.totalUsers, active: data.activeSessions },
          sessions: { ...prev?.sessions, total: data.totalSessions, active: data.activeSessions }
        }));
      });

      onAdminJoined(() => {
        setIsSocketConnected(true);
        setSocketConnectionError(null);
      });

      setIsSocketConnected(true);
      setSocketConnectionError(null);

      return () => {
        disconnectSocket();
        setIsSocketConnected(false);
      };
    }
  }, [isSignedIn, authUser, clerkUser, authToken]);

  // User role update
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      if (!authToken) throw new Error('Authentication token could not be retrieved');
      const response = await apiClient.admin.updateUserRole(userId, newRole, authToken);
      if (response.ok) {
        setUsers(prev => prev.map(u => u.clerkId === userId ? { ...u, role: newRole } : u));
        if (reports.length > 0) {
          const reportsRes = await apiClient.admin.getReports(1, 50, undefined, undefined, authToken);
          if (reportsRes.ok) setReports((await reportsRes.json()).data || []);
        }
        alert('User role updated successfully');
      } else throw new Error('Failed to update user role');
    } catch (err) {
      console.error(err);
      alert('Failed to update user role');
    }
  };

  // Suspend user
  const handleSuspendUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;
    try {
      if (!authToken) throw new Error('Authentication token could not be retrieved');
      const response = await apiClient.admin.suspendUser(userId, authToken);
      if (response.ok) {
        setUsers(prev => prev.map(u => u.clerkId === userId ? { ...u, isActive: false } : u));
        if (reports.length > 0) {
          const reportsRes = await apiClient.admin.getReports(1, 50, undefined, undefined, authToken);
          if (reportsRes.ok) setReports((await reportsRes.json()).data || []);
        }
        alert('User suspended successfully');
      } else throw new Error('Failed to suspend user');
    } catch (err) {
      console.error(err);
      alert('Failed to suspend user');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B0F14] via-[#0D1117] to-[#0B0F14] text-white overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 shadow-md h-14 flex items-center px-4 sm:px-6 md:px-8 justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-white">Admin Dashboard</h1>
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
            <div className="text-lg font-medium text-gray-300">Loading admin dashboard</div>
            <div className="mt-2 text-sm text-gray-500">Initializing administrative tools...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn || !authUser || authUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo and Title */}
              <div className="flex items-center">
                <button
                  className="mr-4 lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  onClick={toggleSidebar}
                  aria-label="Open sidebar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
                <div className="flex items-center">
                 
                  <div>
                    <h1 className="text-base hidden  sm:text-lg font-semibold text-gray-800">Admin Dashboard</h1>
                    <p className=" sm:text-2xl font-semibold text-gray-800 **:sm:block">Administrator Panel</p>
                  </div>

                </div>
              </div>

              {/* User Info and Actions */}
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{authUser?.username || authUser?.email || 'Admin User'}</span>
                </div>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 transition-colors duration-200 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="hidden sm:inline">Dashboard</span>
                </button>

                <button
                  onClick={() => navigate('/profile')}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden sm:inline">Profile</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main tab content */}
        <main className="max-w-2xl md:max-w-3xl lg:max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white p-5 shadow rounded-lg  ">
              {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

              {activeTab === 'users' && <UserManagement users={users} onUpdateUserRole={handleUpdateUserRole} onSuspendUser={handleSuspendUser} loading={loading} error={error} />}

              {activeTab === 'sessions' && <SessionManagement sessions={sessions} loading={loading} error={error} currentUserId={authUser?.clerkId} />}
              {activeTab === 'stats' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Statistics</h2>

                  {stats ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-800">Total Users</p>
                          <p className="text-2xl font-bold text-blue-600">{stats.users?.total || 0}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-green-800">Active Users</p>
                          <p className="text-2xl font-bold text-green-600">{stats.users?.active || 0}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-purple-800">Total Sessions</p>
                          <p className="text-2xl font-bold text-purple-600">{stats.sessions?.total || 0}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <p className="text-sm text-yellow-800">Active Sessions</p>
                          <p className="text-2xl font-bold text-yellow-600">{stats.sessions?.active || 0}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">User Distribution</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Admins</span>
                              <span>{stats.users?.admins || 0} ({Math.round(((stats.users?.admins || 0) / Math.max(1, stats.users?.total || 1)) * 100)}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Regular Users</span>
                              <span>{(stats.users?.total || 0) - (stats.users?.admins || 0)} ({Math.round(((stats.users?.total || 0) - (stats.users?.admins || 0)) / Math.max(1, stats.users?.total || 1) * 100)}%)</span>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">Recent Activity</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Messages (30 days): </span>
                              <span>{stats.messages?.recent30Days || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Snippets: </span>
                              <span>{stats.snippets?.total || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Loading statistics...
                    </div>
                  )}

                  {/* Real-time Admin Monitoring */}
                  <div className="mt-6 border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-gray-900">Real-time Activity Monitor</h3>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                          {isSocketConnected ? 'Connected' : 'Connecting...'}
                        </span>
                        {socketConnectionError && (
                          <span className="text-sm text-red-500 ml-2" title={socketConnectionError}>
                            ⚠️ Connection Issue
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {adminNotifications.length > 0 ? (
                        adminNotifications.map((notification, index) => (
                          <div key={index} className="flex items-start p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                            <div className="flex-1">
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded">
                              {notification.type?.replace('-', ' ') || 'info'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No recent activity notifications
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'reports' && <ReportsManagement reports={reports} loading={loading} error={error} onResolveReport={async (reportId, action) => {
                try {
                  if (!authToken) throw new Error('Authentication token could not be retrieved');
                  const status = action === 'resolve' ? 'resolved' : 'dismissed';
                  const response = await apiClient.admin.updateReportStatus(reportId, status, `Report ${action} by admin`, authToken);
                  if (response.ok) {
                    const reportsRes = await apiClient.admin.getReports(1, 50, undefined, undefined, authToken);
                    if (reportsRes.ok) setReports((await reportsRes.json()).data || []);
                    alert(`Report ${action} successfully`);
                  }
                } catch (err) {
                  console.error(err);
                  alert('Failed to resolve report');
                }
              }} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
