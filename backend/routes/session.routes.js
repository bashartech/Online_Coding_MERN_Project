import express from 'express';
import { createSession, getSessionById, updateSession, getUserSessions, deleteSession } from '../controllers/session.controller.js';
import clerkAuth from '../middleware/auth.js';

const router = express.Router();

// Apply Clerk authentication middleware to all session routes
router.use(clerkAuth);

// Session CRUD routes
router.post('/', createSession);              // Create new session
router.get('/', getUserSessions);            // Get all user's sessions
router.get('/:sessionId', getSessionById);   // Get specific session
router.put('/:sessionId', updateSession);    // Update specific session
router.delete('/:sessionId', deleteSession); // Delete specific session

export default router;