# Quick Start: Real-Time Collaboration

## Overview
This guide explains how to set up and use the real-time collaboration feature in the MERN stack collaborative code editor.

## Prerequisites
- Node.js v20+ installed
- MongoDB running locally or accessible remotely
- Existing authentication system (Clerk) configured
- Socket.IO already installed in backend (v4.7+)
- socket.io-client installed in frontend (v4.7+)

## Environment Setup

### Backend Dependencies
```bash
# Navigate to backend directory
cd backend
# Socket.IO is already installed in the project
npm install  # Install any missing dependencies
```

### Frontend Dependencies
```bash
# Navigate to project root (dependencies already installed)
npm install  # Install any missing frontend dependencies
```

## Configuration

### 1. Backend Socket.IO Setup
The collaboration feature is already implemented in server.js. The existing Socket.IO infrastructure handles real-time features:

```javascript
// server.js already contains Socket.IO setup
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || "http://localhost:3000" || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
```

### 2. Environment Variables
Ensure these are set in your `.env` file:
```env
# Backend .env
MONGODB_URI=mongodb://localhost:27017/online_collab
PORT=5000
CLERK_SECRET_KEY=your_clerk_secret_key
SOCKET_IO_CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Frontend .env (if separate)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
REACT_APP_API_BASE_URL=http://localhost:5000
```

## Running the Application

### 1. Start Backend
```bash
cd backend
npm start
# or
node server.js
```

### 2. Start Frontend
```bash
# From project root
npm run dev
# This typically runs Vite development server on port 5173
```

## How to Use the Collaboration Feature

### 1. Creating a Collaborative Session
1. Log in to the application using Clerk authentication
2. Navigate to the dashboard
3. Click "Create New Session"
4. The session will be created with you as the owner
5. The session will have a unique sessionKey and collaborators array

### 2. Managing Collaborators
Currently, collaborators can be added to the session through the Session model in MongoDB:
- Add user Clerk IDs to the `collaborators` array in the session document
- Future admin panel will manage this (Day 5 feature)

### 3. Joining a Session
1. Navigate to the session URL (e.g., `/session/{sessionId}`)
2. The SessionEditorWrapper will load the session data
3. If you're the owner or in the collaborators array, you'll have access
4. The code editor will load with collaboration features enabled

### 4. Real-Time Editing
- Make changes to the code in the Monaco editor
- Changes are sent via Socket.IO `code-change` events
- Changes appear in real-time for all authorized users in the session
- All changes are automatically persisted to MongoDB (Snippet model)

### 5. Chat and Communication
- Use the chat functionality to communicate with other collaborators
- Messages are persisted to the ChatMessage collection
- All session participants receive messages in real-time

## Key Features Explained

### Session Access Control
- Currently, the server.js implementation allows any user with sessionKey to join
- **ENHANCEMENT NEEDED**: Add authorization check to verify user is session owner OR in collaborators[] array
- Authentication verified through existing Clerk integration

### Code Synchronization
- Changes are broadcast to all session participants in real-time via Socket.IO
- Code is persisted to MongoDB through Snippet model
- Multiple files per session are supported through the file explorer

### Current Limitations
- **Security Gap**: No authorization check in Socket.IO events - anyone with sessionKey can join
- **Missing Feature**: No presence indicators showing who is currently online
- **Missing Feature**: No real-time user presence tracking

## Development Tips

### Testing Collaboration Locally
1. Open two browser windows/tabs
2. Log in as different users (or same user with incognito window)
3. Join the same session in both browsers (currently allows anyone with key)
4. Make changes in one window and observe real-time updates in the other

### Debugging Socket Connections
- Check browser console for socket connection status
- Enable Socket.IO debugging: `localStorage.debug = 'socket.io-client:*'` in browser console
- Check server logs for connection and code-change events
- Monitor the MongoDB collections (sessions, snippets, chatmessages) for real-time updates

### Database Collections
Monitor these collections for collaboration data:
- `sessions`: Contains session information including collaborators array
- `snippets`: Contains code content for each file in sessions
- `chatmessages`: Contains chat messages exchanged in sessions
- `users`: Contains Clerk user information

## Troubleshooting

### Common Issues
- **Socket connection fails**: Check that Socket.IO server is running and CORS settings are correct
- **Changes not syncing**: Verify database connection and that Socket.IO events are firing
- **Access control not working**: The current implementation lacks proper authorization checks
- **Code not persisting**: Verify database connection and write permissions to Snippet model

### Expected Enhancements
- **Critical**: Add authorization checks to Socket.IO events to verify user access
- **Missing**: Presence indicators for online collaborators
- **Missing**: User-friendly error messages for access denied scenarios

### Error Messages
- "Session not found": Invalid session ID provided
- "Connection failed": Socket.IO server unreachable
- **Note**: Currently no access denied messages since authorization is not implemented in Socket.IO layer