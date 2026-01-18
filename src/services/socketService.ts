import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize socket connection
 * @param {string} backendUrl - The backend URL to connect to
 * @returns {Socket} The socket instance
 */
export const initSocket = (backendUrl: string): Socket => {
  // Close existing socket if it exists to avoid multiple connections
  if (socket) {
    socket.disconnect();
  }

  socket = io(backendUrl, {
    transports: ['websocket', 'polling'], // Use both transports as fallback
    reconnection: true,
    reconnectionAttempts: Infinity, // Retry indefinitely
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    rejectUnauthorized: false, // Allow self-signed certificates in development
  });

  return socket;
};

/**
 * Get the current socket instance
 * @returns {Socket} The socket instance or null if not initialized
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Connect to a session
 * @param {string} sessionKey - The session key to join
 * @param {string} userId - The user ID
 * @param {Function} callback - Callback function to handle connection response
 */
export const joinSession = (sessionKey: string, userId: string, callback: (error: { error: string } | null, result: any) => void): void => {
  if (socket) {
    socket.emit('join-session', { sessionKey, userId });

    // Listen for errors - we'll use a once listener for one-time join responses
    const handleError = (errorData: { error: string }) => {
      console.error('Socket error:', errorData);
      callback(errorData, null);
    };

    socket.once('error', handleError);
  }
};

/**
 * Leave a session
 * @param {string} sessionKey - The session key to leave
 */
export const leaveSession = (sessionKey: string): void => {
  if (socket && sessionKey) {
    socket.emit('leave-session', { sessionKey });
  }
};

/**
 * Send code change to the server
 * @param {string} sessionKey - The session key
 * @param {string} code - The updated code
 * @param {string} userId - The user ID
 * @param {string} language - The programming language
 * @param {string} fileName - The file name (optional)
 */
export const sendCodeChange = (sessionKey: string, code: string, userId: string, language = 'javascript'): void => {
  if (socket) {
    socket.emit('code-change', {
      sessionKey,
      code,
      userId,
      language
    });
  }
};

/**
 * Send a language change to the session
 * @param {string} sessionKey - The session key
 * @param {string} userId - The user ID
 * @param {string} language - The new programming language
 */
export const sendLanguageChange = (sessionKey: string, userId: string, language: string): void => {
  if (socket) {
    socket.emit('language-change', {
      sessionKey,
      userId,
      language
    });
  }
};

/**
 * Listen for language updates from other users
 * @param {Function} callback - Callback function to handle language updates
 */
export const onLanguageUpdate = (callback: (data: {
  userId: string;
  language: string;
  timestamp: Date;
}) => void): void => {
  if (socket) {
    socket.off('language-update').on('language-update', callback);
  }
};

/**
 * Send a message to the session
 * @param {string} sessionKey - The session key
 * @param {string} userId - The user ID
 * @param {string} message - The message to send
 */
export const sendMessage = (sessionKey: string, userId: string, message: string): void => {
  if (socket) {
    socket.emit('send-message', {
      sessionKey,
      userId,
      message
    });
  }
};

/**
 * Listen for code updates from other users
 * @param {Function} callback - Callback function to handle code updates
 */
export const onCodeUpdate = (callback: (data: {
  userId: string;
  code: string;
  language: string;
  timestamp: Date;
}) => void): void => {
  if (socket) {
    socket.off('code-update').on('code-update', callback);
  }
};

/**
 * Listen for user joined events
 * @param {Function} callback - Callback function to handle user joined events
 */
export const onUserJoined = (callback: (data: {
  userId: string;
  message: string;
}) => void): void => {
  if (socket) {
    socket.off('user-joined').on('user-joined', callback);
  }
};

/**
 * Listen for user left events
 * @param {Function} callback - Callback function to handle user left events
 */
export const onUserLeft = (callback: (data: {
  userId: string;
  message: string;
}) => void): void => {
  if (socket) {
    socket.off('user-left').on('user-left', callback);
  }
};

/**
 * Listen for presence update events
 * @param {Function} callback - Callback function to handle presence update events
 */
export const onPresenceUpdate = (callback: (data: {
  users: Array<{
    userId: string;
    socketId?: string;
    joinedAt?: Date;
    lastActive: Date;
    isOnline: boolean;
    [key: string]: any;
  }>;
}) => void): void => {
  if (socket) {
    socket.off('presence-update').on('presence-update', callback);
  }
};

/**
 * Listen for initial presence list event
 * @param {Function} callback - Callback function to handle initial presence list
 */
export const onPresenceList = (callback: (data: {
  users: Array<{
    userId: string;
    socketId?: string;
    joinedAt?: Date;
    lastActive: Date;
    isOnline: boolean;
    [key: string]: any;
  }>;
}) => void): void => {
  if (socket) {
    socket.off('presence-list').on('presence-list', callback);
  }
};

/**
 * Listen for receive message events
 * @param {Function} callback - Callback function to handle received messages
 */
export const onReceiveMessage = (callback: (data: {
  senderId: string;
  message: string;
  timestamp: Date;
  messageId: string;
}) => void): void => {
  if (socket) {
    socket.off('receive-message').on('receive-message', callback);
  }
};

/**
 * Listen for errors
 * @param {Function} callback - Callback function to handle errors
 */
export const onError = (callback: (error: {
  error: string;
}) => void): void => {
  if (socket) {
    socket.off('error').on('error', (errorData:any) => {
      // Make sure we're passing the right format to the callback
      if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
        callback(errorData as { error: string });
      } else {
        // Handle other error formats if needed
        callback({ error: typeof errorData === 'string' ? errorData : 'Unknown error' });
      }
    });
  }
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Check if socket is connected
 * @returns {boolean} Whether the socket is connected
 */
export const isConnected = (): boolean => {
  return socket ? socket.connected : false;
};

/**
 * Listen for socket connection events
 * @param {Function} callback - Callback function to handle connection events
 */
export const onConnect = (callback: () => void): void => {
  if (socket) {
    socket.off('connect').on('connect', callback);
  }
};

/**
 * Listen for socket disconnection events
 * @param {Function} callback - Callback function to handle disconnection events
 */
export const onDisconnect = (callback: (reason: any) => void): void => {
  if (socket) {
    socket.off('disconnect').on('disconnect', callback);
  }
};

/**
 * Listen for socket connection error events
 * @param {Function} callback - Callback function to handle connection error events
 */
export const onConnectError = (callback: (error: any) => void): void => {
  if (socket) {
    socket.off('connect_error').on('connect_error', callback);
  }
};

/**
 * Join a session via access code
 * @param {string} accessCode - The access code to join the session
 * @param {string} userId - The user ID
 * @param {Function} callback - Callback function to handle connection response
 */
export const joinSessionViaCode = (accessCode: string, userId: string, callback: (error: { error: string } | null, result: any) => void): void => {
  if (socket) {
    socket.emit('join-session-via-code', { accessCode, userId });

    // Listen for errors - we'll use a once listener for one-time join responses
    const handleError = (errorData: { error: string }) => {
      console.error('Socket error:', errorData);
      callback(errorData, null);
    };

    socket.once('error', handleError);
  }
};