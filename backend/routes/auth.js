import express from 'express';
import { getUserProfile, verifyToken, getUserByClerkId } from '../controllers/authController.js';

const router = express.Router();

// Get user profile or create if doesn't exist
router.post('/profile', getUserProfile);

// Verify token and get user info
router.get('/verify', verifyToken);

// Get user by Clerk ID
router.get('/user/:clerkId', getUserByClerkId);

export default router;