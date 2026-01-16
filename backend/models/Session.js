import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    isPublic: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: "javascript",
      enum: ["javascript", "python", "java", "cpp", "c", "html", "css", "typescript", "go", "rust", "php", "ruby", "sql"]
    },
    maxParticipants: {
      type: Number,
      default: 10
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sessionKey: {
      type: String,
      unique: true,
      required: true
    },
    accessCode: {
      type: String
    }
  },
  { timestamps: true }
);

// Index for faster querying
sessionSchema.index({ sessionKey: 1 });
sessionSchema.index({ ownerId: 1 });
sessionSchema.index({ isActive: 1 });

export default mongoose.model("Session", sessionSchema);