import User from '../models/User.js';
import Session from '../models/Session.js';
import Snippet from '../models/Snippet.js';
import ChatMessage from '../models/ChatMessage.js';
import Report from '../models/Report.js';

/**
 * Get all users with pagination and filtering
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      filter.role = role;
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with filters and pagination
    const users = await User.find(filter)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination metadata
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve users'
    });
  }
};

/**
 * Get all sessions with pagination and filtering
 */
export const getAllSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;

    // Build filter object
    const filter = {};
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sessions with filters and pagination
    const sessions = await Session.find(filter)
      .populate('ownerId', 'username email firstName lastName') // Populate owner info
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination metadata
    const total = await Session.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve sessions'
    });
  }
};

/**
 * Get platform statistics
 */
export const getPlatformStats = async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments({});
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Get session statistics
    const totalSessions = await Session.countDocuments({});
    const activeSessions = await Session.countDocuments({ isActive: true });

    // Get snippet statistics
    const totalSnippets = await Snippet.countDocuments({});

    // Get chat message statistics (recent 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMessages = await ChatMessage.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: adminUsers,
          active: activeUsers
        },
        sessions: {
          total: totalSessions,
          active: activeSessions
        },
        snippets: {
          total: totalSnippets
        },
        messages: {
          recent30Days: recentMessages
        }
      }
    });
  } catch (error) {
    console.error('Error getting platform stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve platform statistics'
    });
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid role. Valid roles: user, admin'
      });
    }

    // Check if the requesting user is trying to change their own role
    // (This could be allowed in some systems, but for security let's restrict it)
    const requestingUser = req.user; // Set by adminAuth middleware
    if (requestingUser && requestingUser.clerkId === userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot change your own role. Contact another admin.'
      });
    }

    // Find user and update role
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        role: user.role
      },
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user role'
    });
  }
};

/**
 * Delete (ban/suspend) user
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Check if trying to delete self
    const requestingUser = req.user; // Set by adminAuth middleware
    if (user.clerkId === requestingUser.clerkId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot suspend yourself'
      });
    }

    // Prevent demotion of other admins by non-super admins (if we had that concept)
    // For now, just ensure the requesting user is authorized
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient privileges to suspend user'
      });
    }

    // For soft deletion, just deactivate the user
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User suspended successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user'
    });
  }
};

/**
 * Get user details
 */
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ clerkId: userId })
      .select('-password') // Exclude password field
      .populate({
        path: 'sessions',
        select: 'title createdAt updatedAt isActive',
        options: { sort: { createdAt: -1 }, limit: 10 } // Get last 10 sessions
      });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user details'
    });
  }
};

/**
 * Get all reports with pagination and filtering
 */
export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { reason: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      filter.status = status;
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reports with filters and pagination
    const reports = await Report.find(filter)
      .populate('reporterId', 'username email firstName lastName')
      .populate('reportedUserId', 'username email firstName lastName')
      .populate('sessionId', 'title')
      .populate('resolvedBy', 'username email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination metadata
    const total = await Report.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve reports'
    });
  }
};

/**
 * Update report status (resolve/dismiss)
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, resolutionNotes } = req.body;

    // Validate status
    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status. Valid statuses: pending, reviewed, resolved, dismissed'
      });
    }

    // Verify the requesting user is authorized (already handled by adminAuth middleware)
    const requestingUser = req.user;
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient privileges to update report status'
      });
    }

    // Find report and update status
    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        status,
        resolvedBy: requestingUser._id, // Set to current admin user
        resolutionNotes: resolutionNotes || '',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('reporterId', 'username email firstName lastName')
    .populate('reportedUserId', 'username email firstName lastName')
    .populate('sessionId', 'title')
    .populate('resolvedBy', 'username email firstName lastName');

    if (!report) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report,
      message: `Report status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update report status'
    });
  }
};