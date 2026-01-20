
import React, { useState } from 'react';

interface User {
  _id: string;
  clerkId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  avatar: string;
  createdAt: string;
}

interface UserManagementProps {
  users: User[];
  onUpdateUserRole: (userId: string, newRole: string) => void;
  onSuspendUser: (userId: string) => void;
  loading: boolean;
  error: string | null;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onUpdateUserRole,
  onSuspendUser,
  loading,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-medium text-gray-900">Manage Users</h2>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 text-gray-900 sm:space-x-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile View - Cards for small screens */}
          <div className="sm:hidden space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {filteredUsers.map((user) => (
              <div key={user._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    {user.avatar ? (
                      <img className="h-10 w-10 rounded-full"
                      src={user.avatar}
                       alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm text-gray-600">
                          {user.firstName?.charAt(0) || user.lastName?.charAt(0) || ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.username}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Email:</span>
                    <span className="ml-2 text-gray-700">{user.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Role:</span>
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateUserRole(user.clerkId, e.target.value)}
                      className={`ml-2 text-sm rounded px-2 py-1 ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs leading-5 font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Joined:</span>
                    <span className="ml-2 text-gray-700">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => onSuspendUser(user.clerkId)}
                    disabled={!user.isActive}
                    className={`text-sm ${
                      user.isActive
                        ? 'text-red-600 hover:text-red-900'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {user.isActive ? 'Suspend User' : 'Suspended'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table for larger screens */}
          <div className="hidden sm:block overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img className="h-10 w-10 rounded-full"
                            src={user.avatar}
                             alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm text-gray-600">
                                {user.firstName?.charAt(0) || user.lastName?.charAt(0) || ''}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => onUpdateUserRole(user.clerkId, e.target.value)}
                        className={`text-sm rounded px-2 py-1 ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => onSuspendUser(user.clerkId)}
                        disabled={!user.isActive}
                        className={`mr-2 ${
                          user.isActive
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {user.isActive ? 'Suspend' : 'Suspended'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No users found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default UserManagement;