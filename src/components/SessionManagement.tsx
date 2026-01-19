import React, { useState } from 'react';

interface Session {
  _id: string;
  sessionKey: string;
  title: string;
  ownerId: string;
  language: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SessionManagementProps {
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

const SessionManagement: React.FC<SessionManagementProps> = ({
  sessions,
  loading,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter sessions based on search term and status
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchTerm === '' ||
      session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.sessionKey?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && session.isActive) ||
      (statusFilter === 'inactive' && !session.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Manage Sessions</h2>

        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
          <p>Loading sessions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <div key={session._id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900 truncate">{session.title}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  session.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {session.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-2 text-sm text-gray-600">
                <p>Session Key: <span className="font-mono text-xs bg-gray-200 px-1 rounded">{session.sessionKey.substring(0, 8)}...</span></p>
                <p>Owner: {session.ownerId}</p>
                <p>Language: {session.language}</p>
                <p className="mt-1">Created: {new Date(session.createdAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(session.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredSessions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No sessions found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default SessionManagement;