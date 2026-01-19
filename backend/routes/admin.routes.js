import express from 'express';
import {
  getAllUsers,
  getAllSessions,
  getPlatformStats,
  updateUserRole,
  deleteUser,
  getUserDetails,
  getAllReports,
  updateReportStatus
} from '../controllers/admin.controller.js';
import appAuth from '../middleware/appAuth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Apply application authentication middleware first, then admin authorization
router.use(appAuth); // Authenticate the user with app's JWT token
router.use(adminAuth); // Check if authenticated user has admin role

// User management routes
router.get('/users', getAllUsers);                    // Get all users with pagination/filtering
router.get('/users/:userId', getUserDetails);        // Get specific user details
router.put('/users/:userId/role', updateUserRole);   // Update user role
router.delete('/users/:userId', deleteUser);         // Delete/suspend user

// Session monitoring routes
router.get('/sessions', getAllSessions);             // Get all sessions with pagination/filtering

// Platform statistics routes
router.get('/stats', getPlatformStats);              // Get platform statistics

// Reports management routes
router.get('/reports', getAllReports);               // Get all reports with pagination/filtering
router.put('/reports/:reportId/status', updateReportStatus); // Update report status

export default router;