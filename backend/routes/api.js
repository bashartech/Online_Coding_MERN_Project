import express from 'express';
import { saveSnippet, addCollaborator } from '../controllers/sessionController.js'; // Existing controller for other functions
import { getSessionByAccessCode } from '../controllers/session.controller.js'; // Import access code controller
import clerkAuth from '../middleware/auth.js'; // Use our standardized Clerk auth middleware
import sessionRoutes from './session.routes.js'; // Our new modular session routes

const router = express.Router();

// Use access code route specifically (no auth required for joining sessions)
router.get('/sessions/access/:accessCode', getSessionByAccessCode);

// Use our new session routes (handles POST, GET, PUT for /sessions)
router.use('/sessions', sessionRoutes);

// Other existing routes that still use the old controller
// Save or update a code snippet - protect with Clerk auth
router.post('/snippets', clerkAuth, saveSnippet);

// Add collaborator to session - protect with Clerk auth
router.put('/sessions/:sessionId/collaborators', clerkAuth, addCollaborator);

export default router;