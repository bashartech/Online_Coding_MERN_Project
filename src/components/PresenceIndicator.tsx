import React, { useState, useEffect, useCallback } from 'react';
import {
  onPresenceUpdate as subscribeToPresenceUpdate,
  onPresenceList as subscribeToPresenceList,
  onUserJoined,
  onUserLeft
} from '../services/socketService';

interface UserPresence {
  userId: string;
  socketId?: string;
  joinedAt?: Date;
  lastActive: Date;
  isOnline: boolean;
  username?: string;
  avatar?: string;
  [key: string]: any;
}

interface PresenceIndicatorProps {
  sessionKey: string;
  currentUserId: string;
  onPresenceUpdate?: (users: UserPresence[]) => void;
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  sessionKey,
  currentUserId,
  onPresenceUpdate
}) => {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const updateUsersWithNames = useCallback((users: UserPresence[]): UserPresence[] => {
    return users.map(user => {
      // In a real app, you might fetch user details from your user service
      // For now, we'll generate usernames based on userId
      const isCurrentUser = user.userId === currentUserId;
      return {
        ...user,
        username: isCurrentUser ? 'You' : `User ${user.userId.substring(0, 4)}`,
        avatar: `https://ui-avatars.com/api/?name=${isCurrentUser ? 'You' : user.userId.substring(0, 8)}&background=0D8ABC&color=fff`
      };
    });
  }, [currentUserId]);

  useEffect(() => {
    // Subscribe to presence events
    const handlePresenceUpdate = (data: { users: UserPresence[] }) => {
      const usersWithNames = updateUsersWithNames(data.users);
      setActiveUsers(usersWithNames);

      if (onPresenceUpdate) {
        onPresenceUpdate(usersWithNames);
      }
      setLoading(false);
    };

    const handlePresenceList = (data: { users: UserPresence[] }) => {
      const usersWithNames = updateUsersWithNames(data.users);
      setActiveUsers(usersWithNames);

      if (onPresenceUpdate) {
        onPresenceUpdate(usersWithNames);
      }
      setLoading(false);
    };

    // Subscribe to socket events
    subscribeToPresenceUpdate(handlePresenceUpdate);
    subscribeToPresenceList(handlePresenceList);

    // Note: The other event handlers (onUserJoined, onUserLeft) will trigger
    // presence updates through the presence-update event, so we don't need
    // to handle them separately here

    // Cleanup function to unsubscribe from events
    return () => {
      // Since we're using a functional approach in the socket service,
      // the listeners are automatically managed by the off/on pattern
      // In a real implementation, you might need to store subscription references
    };
  }, [updateUsersWithNames, onPresenceUpdate]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        <span className="text-xs text-gray-500">Loading presence...</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="flex items-center space-x-1 cursor-pointer">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {activeUsers.length}
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* Tooltip/popover - shown on hover/focus */}
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 hidden group-hover:block group-focus:block p-3">
        <h3 className="font-semibold text-gray-900 mb-2">Active Collaborators</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {activeUsers.map((user) => (
            <div
              key={user.userId}
              className={`flex items-center space-x-2 p-2 rounded ${
                user.userId === currentUserId
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <img
                src={user.avatar}
                alt={user.username || user.userId}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${user.username || user.userId.substring(0, 8)}&background=0D8ABC&color=fff`;
                }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${user.userId === currentUserId ? 'font-semibold text-blue-700' : 'text-gray-900'}`}>
                  {user.username}
                  {user.userId === currentUserId && ' (You)'}
                </p>
                <p className="text-xs text-gray-500">
                  Online now
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PresenceIndicator;