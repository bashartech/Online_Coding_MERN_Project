import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: String, // Clerk user ID
    required: true,
    ref: 'User'
  },
  reportedUserId: {
    type: String, // Clerk user ID of the reported user
    required: true,
    ref: 'User'
  },
  sessionId: {
    type: String, // Optional session ID if reporting about a session
    ref: 'Session',
    default: null
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'harassment',
      'inappropriate_content',
      'copyright_violation',
      'other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolvedBy: {
    type: String, // Clerk user ID of admin who resolved
    ref: 'User',
    default: null
  },
  resolutionNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Add indexes for efficient querying
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ reportedUserId: 1 });

export default mongoose.model('Report', reportSchema);