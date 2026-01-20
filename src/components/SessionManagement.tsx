
import React, { useState } from 'react';
import PresenceIndicator from './PresenceIndicator';

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
  currentUserId?: string;
}

const SessionManagement: React.FC<SessionManagementProps> = ({
  sessions,
  loading,
  error,
  currentUserId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredSessions = sessions.filter(session => {
    const matchesSearch =
      searchTerm === '' ||
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.sessionKey.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && session.isActive) ||
      (statusFilter === 'inactive' && !session.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header & Filters */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-white">Manage Sessions</h2>
        <div className="flex flex-col text-white sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-[#1E293B] border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-white placeholder-gray-400"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#1E293B] border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error && <div className="p-3 mb-4 bg-red-900 text-red-200 rounded">{error}</div>}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No sessions found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map(session => (
            <div
              key={session._id}
              className="bg-[#1E293B] border border-gray-700 rounded-lg p-4 hover:bg-[#2D3748] transition relative"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-white truncate">{session.title}</h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    session.isActive ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                  }`}
                >
                  {session.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-2 text-sm text-gray-400 space-y-1">
                <p>
                  Session Key:{' '}
                  <span className="font-mono text-xs bg-gray-800 px-1 rounded text-gray-300">
                    {session.sessionKey.substring(0, 8)}...
                  </span>
                </p>
                <p>Owner: {session.ownerId}</p>
                <p>Language: {session.language}</p>
                <p>Created: {new Date(session.createdAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(session.updatedAt).toLocaleDateString()}</p>
              </div>

              {/* PresenceIndicator - only show if we have a currentUserId */}
              {currentUserId && (
                <div className="mt-3">
                  <PresenceIndicator
                    sessionKey={session.sessionKey}
                    currentUserId={currentUserId}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
