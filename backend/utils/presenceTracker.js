// In-memory storage for tracking user presence in sessions
// Note: In a production environment, this would be replaced with Redis or a database
const activeSessions = new Map(); // Maps sessionKey to Map of userId to userInfo
const userSessions = new Map(); // Maps userId to Set of sessionKeys (track which sessions a user is in)

/**
 * Get the sessions a user is currently in (private function)
 * @param {string} userId - The user ID
 * @returns {Set} Set of session keys the user is in
 */
const getUserSessionSet = (userId) => {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, new Set());
  }
  return userSessions.get(userId);
};

/**
 * Add a user to a session's active users list
 * @param {string} sessionKey - The session key
 * @param {string} userId - The user ID
 * @param {Object} userInfo - Optional user info (username, avatar, etc.)
 */
export const addUserToSession = (sessionKey, userId, userInfo = {}) => {
  if (!activeSessions.has(sessionKey)) {
    activeSessions.set(sessionKey, new Map());
  }

  const sessionUsers = activeSessions.get(sessionKey);
  sessionUsers.set(userId, {
    ...userInfo,
    lastActive: new Date(),
    isOnline: true
  });

  // Track which sessions this user is in
  const userSessionSet = getUserSessionSet(userId);
  userSessionSet.add(sessionKey);
};

/**
 * Remove a user from a session's active users list
 * @param {string} sessionKey - The session key
 * @param {string} userId - The user ID
 */
export const removeUserFromSession = (sessionKey, userId) => {
  if (activeSessions.has(sessionKey)) {
    const sessionUsers = activeSessions.get(sessionKey);
    sessionUsers.delete(userId);

    // Clean up empty session maps
    if (sessionUsers.size === 0) {
      activeSessions.delete(sessionKey);
    }
  }

  // Remove session from user's session tracking
  if (userSessions.has(userId)) {
    const userSessionSet = userSessions.get(userId);
    userSessionSet.delete(sessionKey);

    // Clean up empty user session sets
    if (userSessionSet.size === 0) {
      userSessions.delete(userId);
    }
  }
};

/**
 * Get all active users in a session
 * @param {string} sessionKey - The session key
 * @returns {Array} Array of user objects with id, username, avatar, lastActive, isOnline
 */
export const getActiveUsersInSession = (sessionKey) => {
  if (!activeSessions.has(sessionKey)) {
    return [];
  }

  const sessionUsers = activeSessions.get(sessionKey);
  const users = [];

  sessionUsers.forEach((userInfo, userId) => {
    users.push({
      userId,
      ...userInfo
    });
  });

  return users;
};

/**
 * Update a user's last active timestamp in a session
 * @param {string} sessionKey - The session key
 * @param {string} userId - The user ID
 */
export const updateUserActivity = (sessionKey, userId) => {
  if (activeSessions.has(sessionKey)) {
    const sessionUsers = activeSessions.get(sessionKey);
    if (sessionUsers.has(userId)) {
      const userInfo = sessionUsers.get(userId);
      userInfo.lastActive = new Date();
      sessionUsers.set(userId, userInfo);
    }
  }
};

/**
 * Check if a user is active in a session
 * @param {string} sessionKey - The session key
 * @param {string} userId - The user ID
 * @returns {boolean} Whether the user is active in the session
 */
export const isUserActiveInSession = (sessionKey, userId) => {
  if (!activeSessions.has(sessionKey)) {
    return false;
  }

  return activeSessions.get(sessionKey).has(userId);
};

/**
 * Get all active sessions
 * @returns {Array} Array of session keys that have active users
 */
export const getActiveSessions = () => {
  return Array.from(activeSessions.keys());
};

/**
 * Get all sessions a user is currently in
 * @param {string} userId - The user ID
 * @returns {Array} Array of session keys the user is in
 */
export const getUserSessions = (userId) => {
  if (!userSessions.has(userId)) {
    return [];
  }
  return Array.from(userSessions.get(userId));
};

/**
 * Remove a user from all sessions (e.g., when they disconnect)
 * @param {string} userId - The user ID
 */
export const removeUserFromAllSessions = (userId) => {
  if (userSessions.has(userId)) {
    const userSessionSet = userSessions.get(userId);

    // Remove user from each session they're in
    for (const sessionKey of userSessionSet) {
      if (activeSessions.has(sessionKey)) {
        const sessionUsers = activeSessions.get(sessionKey);
        sessionUsers.delete(userId);

        // Clean up empty session maps
        if (sessionUsers.size === 0) {
          activeSessions.delete(sessionKey);
        }
      }
    }

    // Remove the user's session tracking
    userSessions.delete(userId);
  }
};