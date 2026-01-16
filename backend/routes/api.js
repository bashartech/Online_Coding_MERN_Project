import express from 'express';
import { createSession, saveSnippet, getSession, addCollaborator } from '../controllers/sessionController.js';
import { clerkMiddleware } from '@clerk/express'; // Use Clerk's auth middleware
import Session from '../models/Session.js';

const router = express.Router();

// Create a new session - protect with Clerk auth
router.post('/sessions', clerkMiddleware(), createSession);

// Save or update a code snippet - protect with Clerk auth
router.post('/snippets', clerkMiddleware(), saveSnippet);

// Get a specific session - protect with Clerk auth
router.get('/sessions/:sessionId', clerkMiddleware(), getSession);

// Add collaborator to session - protect with Clerk auth
router.put('/sessions/:sessionId/collaborators', clerkMiddleware(), addCollaborator);

// Get all user's sessions - protect with Clerk auth
router.get('/sessions', clerkMiddleware(), async (req, res) => {
  try {
    // Get user from Clerk auth
    const clerkUserId = req.auth.userId;

    const sessions = await Session.find({
      $or: [
        { ownerId: clerkUserId },
        { collaborators: { $in: [clerkUserId] } }
      ]
    }).populate('ownerId', 'username email');

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;