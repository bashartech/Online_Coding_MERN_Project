import Session from '../models/Session.js';

/**
 * Check if a user has access to a specific session
 * @param {string} userId - The user ID to check
 * @param {string} sessionKey - The session key to check access for
 * @returns {Promise<boolean>} - Whether the user has access
 */
export const checkSessionAccess = async (userId, sessionKey) => {
  try {
    // Find the session by sessionKey
    const session = await Session.findOne({ sessionKey });

    if (!session) {
      return false; // Session doesn't exist
    }

    // Check if user is the owner OR in the collaborators array
    const isOwner = session.ownerId === userId;
    const isCollaborator = session.collaborators.includes(userId);

    return isOwner || isCollaborator;
  } catch (error) {
    console.error('Error checking session access:', error);
    return false;
  }
};

/**
 * Get session information for access verification
 * @param {string} sessionKey - The session key to retrieve
 * @returns {Promise<Object|null>} - Session object or null if not found
 */
export const getSessionInfo = async (sessionKey) => {
  try {
    const session = await Session.findOne({ sessionKey });
    return session;
  } catch (error) {
    console.error('Error getting session info:', error);
    return null;
  }
};