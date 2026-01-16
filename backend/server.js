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

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
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

// Example route to create a session
app.post('/api/sessions', async (req, res) => {
  try {
    const { title, ownerId, language, isPublic } = req.body;
    const session = new Session({
      title,
      ownerId,
      language,
      isPublic,
      sessionKey: Math.random().toString(36).substring(2, 10) // Generate random session key
    });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Socket.IO for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a session room
  socket.on('join-session', async (sessionKey) => {
    socket.join(sessionKey);

    // Notify others in the room
    socket.to(sessionKey).emit('user-joined', {
      userId: socket.id,
      message: 'A new user joined the session'
    });
  });

  // Handle real-time code changes
  socket.on('code-change', async (data) => {
    const { sessionKey, code, userId, language } = data;

    // Save the code to database
    try {
      // Find or create a snippet for this user in this session
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
          author: userId,
          sessionId: sessionKey
        });
        await snippet.save();
      }

      // Broadcast the change to all other users in the session
      socket.to(sessionKey).emit('code-update', {
        userId: userId,
        code: code,
        language: language,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving code to database:', error);
    }
  });

  // Handle chat messages
  socket.on('send-message', async (data) => {
    const { sessionKey, userId, message } = data;

    try {
      // Save chat message to database
      const chatMessage = new ChatMessage({
        sessionId: sessionKey,
        senderId: userId,
        message: message
      });
      await chatMessage.save();

      // Broadcast message to all users in the session
      io.to(sessionKey).emit('receive-message', {
        senderId: userId,
        message: message,
        timestamp: new Date(),
        messageId: chatMessage._id
      });
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});