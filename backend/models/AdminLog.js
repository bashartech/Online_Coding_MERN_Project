import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        "user_banned",
        "user_unbanned",
        "session_deleted",
        "content_moderated",
        "user_role_changed",
        "system_notification_sent"
      ]
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    targetSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session"
    },
    details: {
      type: String,
      default: ""
    },
    ipAddress: {
      type: String
    }
  },
  { timestamps: true }
);

// Index for faster querying
adminLogSchema.index({ adminId: 1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ createdAt: -1 });

export default mongoose.model("AdminLog", adminLogSchema);