import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,  // Use string to match Session model's sessionKey
      ref: "Session",
      required: true
    },
    senderId: {
      type: String,  // Store Clerk user ID as string instead of ObjectId
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000 // Limit message length
    },
    messageType: {
      type: String,
      enum: ["text", "system", "notification"],
      default: "text"
    },
    readBy: [
      {
        userId: {
          type: String, // Store Clerk user ID as string
        },
        readAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

// Index for faster querying
chatMessageSchema.index({ sessionId: 1 });
chatMessageSchema.index({ senderId: 1 });
chatMessageSchema.index({ createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);