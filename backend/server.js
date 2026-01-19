import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js'; // Import auth routes
import User from "./models/User.js";
import Session from "./models/Session.js";
import Snippet from "./models/Snippet.js";
import File from "./models/File.js";
import ChatMessage from "./models/ChatMessage.js";
import AdminLog from "./models/AdminLog.js";
import { checkSessionAccess } from "./services/sessionAccessService.js";
import { isRateLimited } from "./utils/rateLimiter.js";
import { addUserToSession, removeUserFromSession, getActiveUsersInSession, removeUserFromAllSessions, getUserSessions } from "./utils/presenceTracker.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with permissive CORS configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || process.env.FRONTEND_URL || true, // Allow all origins during development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  },
  allowEIO3: true, // Allow Engine.IO v3 (older version)
  transports: ['websocket', 'polling'] // Enable both transports
});

// Connect to MongoDB
connectDB();

// Configure CORS for API routes specifically
app.use(cors({
  origin: process.env.CORS_ORIGIN || ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json());

// Routes - Add auth routes before other API routes
app.use('/api/auth', authRoutes); // Add authentication routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Online Code Collaboration Platform API');
});
  
// Example route to create a user
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}); 
 

// Socket.IO for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join admin monitoring room if user is an admin
  socket.on('join-admin-room', async (data) => {
    const { userId } = data;

    try {
      // Check if user is an admin
      const user = await User.findOne({ clerkId: userId });

      if (user && user.role === 'admin') {
        socket.join('admin-room');
        console.log(`Admin ${userId} joined admin monitoring room`);

        socket.emit('admin-joined', {
          message: 'Connected to admin monitoring'
        });

        // Send initial admin data
        const totalUsers = await User.countDocuments({});
        const totalSessions = await Session.countDocuments({});
        const activeSessions = await Session.countDocuments({ isActive: true });

        socket.emit('admin-stats-update', {
          totalUsers,
          totalSessions,
          activeSessions,
          timestamp: new Date()
        });
      } else {
        socket.emit('error', { error: 'Access denied: Not an admin' });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      socket.emit('error', { error: 'Authentication error' });
    }
  });

  // Join a session room - with authorization check
  socket.on('join-session', async (data) => {
    const { sessionKey, userId } = data;

    console.log(`User ${userId} attempting to join session ${sessionKey}`);

    // Store userId in socket for later use
    socket.userId = userId;

    // Check if user has access to this session
    const hasAccess = await checkSessionAccess(userId, sessionKey);

    if (!hasAccess) {
      socket.emit('error', { error: 'Access denied to session' });
      return;
    }

    socket.join(sessionKey);

    // Log successful join
    console.log(`User ${userId} joined room ${sessionKey}`);

    // Add user to presence tracker
    addUserToSession(sessionKey, userId, {
      socketId: socket.id,
      joinedAt: new Date()
    });

    // Notify others in the room
    socket.to(sessionKey).emit('user-joined', {
      userId: socket.id,
      message: 'A new user joined the session',
      userCount: getActiveUsersInSession(sessionKey).length
    });

    // Emit current presence list to the joining user
    socket.emit('presence-list', {
      users: getActiveUsersInSession(sessionKey)
    });

    // Broadcast updated presence list to all users in the session
    io.to(sessionKey).emit('presence-update', {
      users: getActiveUsersInSession(sessionKey)
    });

    // Notify admins about the new session activity
    const sessionInfo = await Session.findOne({ sessionKey: sessionKey }).select('title language isActive createdAt');
    const userInfo = await User.findOne({ clerkId: userId }).select('username email firstName lastName');

    io.to('admin-room').emit('admin-notification', {
      type: 'session-join',
      message: `User ${userInfo?.username || userId} joined session "${sessionInfo?.title || sessionKey}"`,
      timestamp: new Date(),
      userId,
      sessionKey,
      sessionTitle: sessionInfo?.title
    });
  });

  // Join a session room via access code - with authorization check
  socket.on('join-session-via-code', async (data) => {
    const { accessCode, userId } = data;

    console.log(`User ${userId} attempting to join session via access code ${accessCode}`);

    // Find session by access code
    const session = await Session.findOne({ accessCode: accessCode, isActive: true });

    if (!session) {
      socket.emit('error', { error: 'Invalid access code or session not found' });
      return;
    }

    const sessionKey = session.sessionKey;

    // Store userId in socket for later use
    socket.userId = userId;

    // Check if user has access to this session (either owner or collaborator)
    let hasAccess = await checkSessionAccess(userId, sessionKey);

    // If user doesn't have access yet, add them as a collaborator if the access code is valid
    if (!hasAccess) {
      // Add user to collaborators list
      if (!session.collaborators.includes(userId)) {
        session.collaborators.push(userId);
        await session.save();
      }

      // Now check access again
      hasAccess = await checkSessionAccess(userId, sessionKey);
    }

    if (!hasAccess) {
      socket.emit('error', { error: 'Access denied to session' });
      return;
    }

    socket.join(sessionKey);

    // Log successful join
    console.log(`User ${userId} joined room ${sessionKey} via access code ${accessCode}`);

    // Add user to presence tracker
    addUserToSession(sessionKey, userId, {
      socketId: socket.id,
      joinedAt: new Date()
    });

    // Notify others in the room
    socket.to(sessionKey).emit('user-joined', {
      userId: socket.id,
      message: 'A new user joined the session',
      userCount: getActiveUsersInSession(sessionKey).length
    });

    // Emit current presence list to the joining user
    socket.emit('presence-list', {
      users: getActiveUsersInSession(sessionKey)
    });

    // Broadcast updated presence list to all users in the session
    io.to(sessionKey).emit('presence-update', {
      users: getActiveUsersInSession(sessionKey)
    });

    // Notify admins about the new session activity via access code
    const sessionInfo = await Session.findOne({ sessionKey: sessionKey }).select('title language isActive createdAt');
    const userInfo = await User.findOne({ clerkId: userId }).select('username email firstName lastName');

    io.to('admin-room').emit('admin-notification', {
      type: 'session-join-via-code',
      message: `User ${userInfo?.username || userId} joined session "${sessionInfo?.title || sessionKey}" via access code`,
      timestamp: new Date(),
      userId,
      sessionKey,
      sessionTitle: sessionInfo?.title,
      accessCode
    });
  });

  // Handle real-time code changes - with authorization check and rate limiting
  socket.on('code-change', async (data) => {
    const { sessionKey, code, userId, language } = data;
    // io.emit("code-change",code)

    console.log(`Received  code-change ${code} from user ${userId} for session ${sessionKey}`);

    // Check if user is rate limited
    // if (isRateLimited(userId, 'code-change', 15, 2000)) { // Max 15 changes per 2 seconds
    //   socket.emit('error', { error: 'Too many code change requests' });
    //   return;
    // }

    // Check if user has access to this session
    const hasAccess = await checkSessionAccess(userId, sessionKey);

    if (!hasAccess) {
      socket.emit('error', { error: 'Access denied to session' });
      return;
    }

    // Save the code to database
    try {
      // Find or create a snippet for this user in this session using sessionKey
      let snippet = await Snippet.findOne({
        sessionId: sessionKey,
        author: userId
      });

      if (snippet) {
        // Update existing snippet
        snippet.content = code;
        snippet.language = language;
        await snippet.save();
      } else {
        // Create new snippet
        snippet = new Snippet({
          title: `Code by ${userId}`,
          content: code,
          language: language,
          fileName: 'main.py', // Use a default filename
          author: userId,
          sessionId: sessionKey
        });
        await snippet.save();
      }

      // Log the broadcast
      console.log(`About to broadcast code-update to room: ${sessionKey}`);

      // Get the number of clients in the room to debug
      const room = io.sockets.adapter.rooms.get(sessionKey);
      const numClients = room ? room.size : 0;
      console.log(`Room ${sessionKey} has ${numClients} clients (excluding sender)`);

      // Broadcast the change to other users in the session (excluding sender)
      socket.to(sessionKey).emit('code-update', {
        userId: userId,
        code: code,
        language: language,
        timestamp: new Date()
      });
       console.log("CODE-->>>>",code)

      // Notify admins about the code change
      const sessionInfo = await Session.findOne({ sessionKey: sessionKey }).select('title');
      const userInfo = await User.findOne({ clerkId: userId }).select('username email firstName lastName');

      io.to('admin-room').emit('admin-notification', {
        type: 'code-change',
        message: `User ${userInfo?.username || userId} updated code in session "${sessionInfo?.title || sessionKey}"`,
        timestamp: new Date(),
        userId,
        sessionKey,
        sessionTitle: sessionInfo?.title
      });

      console.log(`Broadcasted code-update to room: ${sessionKey}`);
    } catch (error) {
      console.error('Error saving code to database:', error);
    }
  });

  // Handle language changes - with authorization check
  socket.on('language-change', async (data) => {
    const { sessionKey, userId, language } = data;

    console.log(`Received language-change from user ${userId} for session ${sessionKey}: ${language}`);

    // Check if user has access to this session
    const hasAccess = await checkSessionAccess(userId, sessionKey);

    if (!hasAccess) {
      socket.emit('error', { error: 'Access denied to session' });
      return;
    }

    try {
      // Update the language in the user's snippet
      const snippet = await Snippet.findOneAndUpdate(
        { sessionId: sessionKey, author: userId },
        { language: language },
        { new: true, upsert: true } // Create if doesn't exist
      );

      // Broadcast the language change to ALL users in the session (including sender)
      io.to(sessionKey).emit('language-update', {
        userId: userId,
        language: language,
        timestamp: new Date()
      });

      // Notify admins about the language change
      const sessionInfo = await Session.findOne({ sessionKey: sessionKey }).select('title');
      const userInfo = await User.findOne({ clerkId: userId }).select('username email firstName lastName');

      io.to('admin-room').emit('admin-notification', {
        type: 'language-change',
        message: `User ${userInfo?.username || userId} changed language to ${language} in session "${sessionInfo?.title || sessionKey}"`,
        timestamp: new Date(),
        userId,
        sessionKey,
        sessionTitle: sessionInfo?.title,
        language
      });

      console.log(`Broadcasted language-update to room: ${sessionKey}`);
    } catch (error) {
      console.error('Error updating language in database:', error);
    }
  });

  // Handle leaving a session
  socket.on('leave-session', async (data) => {
    const { sessionKey } = data;
    const userId = socket.userId; // Get userId from stored socket property

    // Check if user has access to this session
    const hasAccess = await checkSessionAccess(userId, sessionKey);

    if (!hasAccess) {
      socket.emit('error', { error: 'Access denied to session' });
      return;
    }

    // Leave the session room
    socket.leave(sessionKey);

    // Remove user from presence tracker
    removeUserFromSession(sessionKey, userId);

    // Notify others in the room that user left
    socket.to(sessionKey).emit('user-left', {
      userId: socket.id,
      message: 'A user left the session',
      userCount: getActiveUsersInSession(sessionKey).length
    });

    // Broadcast updated presence list to all users in the session
    io.to(sessionKey).emit('presence-update', {
      users: getActiveUsersInSession(sessionKey)
    });
  });

  // Handle chat messages - with authorization check and rate limiting
  socket.on('send-message', async (data) => {
    const { sessionKey, userId, message } = data;

    // Check if user is rate limited
    if (isRateLimited(userId, 'send-message', 10, 3000)) { // Max 10 messages per 3 seconds
      socket.emit('error', { error: 'Too many messages sent' });
      return;
    }

    // Check if user has access to this session
    const hasAccess = await checkSessionAccess(userId, sessionKey);

    if (!hasAccess) {
      socket.emit('error', { error: 'Access denied to session' });
      return;
    }

    try {
      // Save chat message to database
      const chatMessage = new ChatMessage({
        sessionId: sessionKey,
        senderId: userId,
        message: message
      });
      await chatMessage.save();

      // Log the broadcast
      console.log(`About to broadcast message to room: ${sessionKey}`);

      // Get the number of clients in the room to debug
      const room = io.sockets.adapter.rooms.get(sessionKey);
      const numClients = room ? room.size : 0;
      console.log(`Room ${sessionKey} has ${numClients} clients (excluding sender)`);

      // Broadcast message to ALL users in the session (including sender for immediate feedback)
      io.to(sessionKey).emit('receive-message', {
        senderId: userId,
        message: message,
        timestamp: new Date(),
        messageId: chatMessage._id
      });

      // Notify admins about the chat message
      const sessionInfo = await Session.findOne({ sessionKey: sessionKey }).select('title');
      const userInfo = await User.findOne({ clerkId: userId }).select('username email firstName lastName');

      io.to('admin-room').emit('admin-notification', {
        type: 'chat-message',
        message: `User ${userInfo?.username || userId} sent a message in session "${sessionInfo?.title || sessionKey}": "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        timestamp: new Date(),
        userId,
        sessionKey,
        sessionTitle: sessionInfo?.title,
        messagePreview: message.substring(0, 50)
      });

      console.log(`Broadcasted message to room: ${sessionKey}`);
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove user from all sessions they were part of
    if (socket.userId) {
      // Get the sessions this user was part of before removing them
      const userSessionKeys = getUserSessions(socket.userId);

      // Use the new function to remove user from all sessions
      removeUserFromAllSessions(socket.userId);

      // Notify users in each session that the user left
      userSessionKeys.forEach(sessionKey => {
        // Broadcast updated presence list to all users in each session
        io.to(sessionKey).emit('presence-update', {
          users: getActiveUsersInSession(sessionKey)
        });
      });

      console.log(`User ${socket.userId} disconnected from socket ${socket.id}`);
    }
  });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});