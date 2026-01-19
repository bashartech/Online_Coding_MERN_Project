import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to validate application JWT token from x-auth-token header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const appAuth = async (req, res, next) => {
  try {
    // Get token from x-auth-token header
    const token = req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_dev', {
      clockTimestamp: Date.now() / 1000, // Use current time for validation
      clockTolerance: 30 // Allow 30 seconds of clock skew (increased for development)
    });

    // Find user by ID from token
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id; // Also set userId for compatibility with adminAuth

    // Proceed to next middleware/route handler
    next();
  } catch (error) {
    console.error('App authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error verifying token'
    });
  }
};

export default appAuth;