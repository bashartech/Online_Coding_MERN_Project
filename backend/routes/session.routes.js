import express from 'express';
import { createSession, getSessionById, updateSession, getUserSessions, deleteSession, generateAccessCode, getSessionByAccessCode } from '../controllers/session.controller.js';
import clerkAuth from '../middleware/auth.js';

const router = express.Router();

// Apply Clerk authentication middleware to session management routes (CRUD)
router.use(clerkAuth);

// Session CRUD routes
router.post('/', createSession);              // Create new session
router.get('/', getUserSessions);            // Get all user's sessions
router.get('/:sessionId', getSessionById);   // Get specific session
router.put('/:sessionId', updateSession);    // Update specific session
router.delete('/:sessionId', deleteSession); // Delete specific session

// Session sharing routes (authenticated users only)
router.post('/:sessionId/generate-access-code', generateAccessCode); // Generate access code for session

// Create a separate router for access code routes (no auth required)
const accessCodeRouter = express.Router();
accessCodeRouter.get('/access/:accessCode', getSessionByAccessCode); // Get session by access code (no auth required)

// Export both routers
export { accessCodeRouter };
export default router;