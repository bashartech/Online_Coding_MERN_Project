import React, { useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/api';
import UserManagement from '../components/UserManagement';
import SessionManagement from '../components/SessionManagement';
import ReportsManagement from '../components/ReportsManagement';
import {
  initSocket,
  joinAdminRoom,
  onAdminNotification,
  onAdminStatsUpdate,
  onAdminJoined,
  disconnectSocket
} from '../services/socketService';

const AdminDashboard: React.FC = () => {
  const { user: clerkUser, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const { user: authUser, token: authToken, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'sessions' | 'stats' | 'reports'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [socketConnectionError, setSocketConnectionError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (authUser && authUser.role !== 'admin') {
      // Redirect to dashboard if not admin
      window.location.href = '/dashboard';
    }
  }, [authUser]);

  // Fetch admin data
  useEffect(() => {
    const fetchData = async () => {
      if (!isSignedIn || !authUser || authUser.role !== 'admin') return;

      try {
        setLoading(true);
        setError(null);

        // Use the token from the AuthContext instead of getting it from Clerk
        const token = authToken;

        if (!token) {
          throw new Error('Authentication token could not be retrieved');
        }

        // Fetch all required data
        const [usersRes, sessionsRes, statsRes, reportsRes] = await Promise.all([
          apiClient.admin.getUsers(1, 50, undefined, undefined, token),
          apiClient.admin.getSessions(1, 50, undefined, undefined, token),
          apiClient.admin.getStats(token),
          apiClient.admin.getReports ? apiClient.admin.getReports(1, 50, undefined, undefined, token) : Promise.resolve({ ok: true, json: async () => ({ data: [] }) })
        ]);
        
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.data || []);
          console.log("USER_data--->>>",usersData)
        } else {
          throw new Error('Failed to load users');
        }

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setSessions(sessionsData.data || []);
        } else {
          throw new Error('Failed to load sessions');
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        } else {
          throw new Error('Failed to load stats');
        }

        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReports(reportsData.data || []);
        } else {
          // Handle case where reports endpoint doesn't exist
          setReports([]);
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSignedIn, authUser, authToken]);

  // Initialize socket connection for admin monitoring
  useEffect(() => {
    if (isSignedIn && authUser && authUser.role === 'admin' && clerkUser && authToken) {
      // Initialize socket
      initSocket(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

      // Join admin room
      joinAdminRoom(clerkUser.id);

      // Listen for admin notifications
      onAdminNotification((data) => {
        setAdminNotifications((prev: any[]) => [data, ...prev.slice(0, 9)]); // Keep last 10 notifications
      });

      // Listen for admin stats updates
      onAdminStatsUpdate((data) => {
        setStats((prev: any) => ({
          ...prev,
          users: {
            ...prev?.users,
            total: data.totalUsers,
            active: data.activeSessions // This is a simplification, we'd need to fetch actual active users
          },
          sessions: {
            ...prev?.sessions,
            total: data.totalSessions,
            active: data.activeSessions
          }
        }));
      });

      // Listen for admin room join events
      onAdminJoined((data) => {
        console.log('Admin joined monitoring:', data.message);
        setIsSocketConnected(true);
        setSocketConnectionError(null);
      });

      setIsSocketConnected(true);
      setSocketConnectionError(null);

      // Clean up on unmount
      return () => {
        disconnectSocket();
        setIsSocketConnected(false);
      };
    }
  }, [isSignedIn, authUser, clerkUser, authToken]);

  // Handle updating user role
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      // Use the token from the AuthContext instead of getting it from Clerk
      const token = authToken;

      if (!token) {
        throw new Error('Authentication token could not be retrieved');
      }

      const response = await apiClient.admin.updateUserRole(userId, newRole, token);

      if (response.ok) {
        // Update local state
        setUsers((prev: any[]) => prev.map(user =>
          user.clerkId === userId ? { ...user, role: newRole } : user
        ));

        // Refresh reports if they exist
        if (reports.length > 0) {
          const reportsRes = await apiClient.admin.getReports(1, 50, undefined, undefined, token);
          if (reportsRes.ok) {
            const reportsData = await reportsRes.json();
            setReports(reportsData.data || []);
          }
        }

        alert('User role updated successfully');
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role');
    }
  };

  // Handle suspending user
  const handleSuspendUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) {
      return;
    }

    try {
      // Use the token from the AuthContext instead of getting it from Clerk
      const token = authToken;

      if (!token) {
        throw new Error('Authentication token could not be retrieved');
      }

      const response = await apiClient.admin.suspendUser(userId, token);

      if (response.ok) {
        // Update local state
        setUsers((prev: any[]) => prev.map(user =>
          user.clerkId === userId ? { ...user, isActive: false } : user
        ));

        // Refresh reports if they exist
        if (reports.length > 0) {
          const reportsRes = await apiClient.admin.getReports(1, 50, undefined, undefined, token);
          if (reportsRes.ok) {
            const reportsData = await reportsRes.json();
            setReports(reportsData.data || []);
          }
        }

        alert('User suspended successfully');
      } else {
        throw new Error('Failed to suspend user');
      }
    } catch (err) {
      console.error('Error suspending user:', err);
      alert('Failed to suspend user');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isSignedIn || !authUser || authUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Dashboard Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Admin: {authUser?.username || authUser?.email}</span>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reports ({reports.length})
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <UserManagement
                users={users}
                onUpdateUserRole={handleUpdateUserRole}
                onSuspendUser={handleSuspendUser}
                loading={loading}
                error={error}
              />
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <SessionManagement
                sessions={sessions}
                loading={loading}
                error={error}
              />
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Statistics</h2>

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
                            {notification.type.replace('-', ' ')}
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

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <ReportsManagement
                reports={reports}
                loading={loading}
                error={error}
                onResolveReport={async (reportId, action) => {
                  try {
                    // Use the token from the AuthContext instead of getting it from Clerk
                    const token = authToken;

                    if (!token) {
                      throw new Error('Authentication token could not be retrieved');
                    }

                    // Determine the status based on the action
                    const status = action === 'resolve' ? 'resolved' : 'dismissed';

                    const response = await apiClient.admin.updateReportStatus(reportId, status, `Report ${action} by admin`, token);

                    if (response.ok) {
                      // Refresh the reports list after successful update
                      const reportsRes = await apiClient.admin.getReports(1, 50, undefined, undefined, token);

                      if (reportsRes.ok) {
                        const reportsData = await reportsRes.json();
                        setReports(reportsData.data || []);
                        alert(`Report ${action} successfully`);
                      } else {
                        throw new Error('Failed to refresh reports list');
                      }
                    } else {
                      throw new Error('Failed to update report status');
                    }
                  } catch (err) {
                    console.error('Error resolving report:', err);
                    alert('Failed to resolve report');
                  }
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;