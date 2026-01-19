import User from '../models/User.js';

/**
 * Middleware to check if user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const adminAuth = async (req, res, next) => {
  try {
    // The user should already be authenticated by appAuth middleware
    // req.user should be set by the appAuth middleware
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. Admin privileges required.'
      });
    }

    // User is authenticated and is an admin, proceed
    // req.user is already set by the appAuth middleware

    // Proceed to next middleware/route handler
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error checking admin privileges'
    });
  }
};

export default adminAuth;