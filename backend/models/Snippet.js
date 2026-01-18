import mongoose from "mongoose";

const snippetSchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: true
    },
    language: {
      type: String,
      default: "javascript",
      enum: ["javascript", "python", "java", "cpp", "c", "html", "css", "typescript", "go", "rust", "php", "ruby", "sql"]
    },
    fileName: {
      type: String,
      default: "index.js",
      required: true
    },
    author: {
      type: String,  // Store Clerk user ID as string instead of ObjectId
      required: true
    },
    sessionId: {
      type: String,  // Store session ID as string to match Session model
      ref: "Session"
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true
    }],
    likes: {
      type: Number,
      default: 0
    },
    likedBy: [{
      type: String,  // Store Clerk user IDs as strings
      ref: "User"
    }]
  },
  { timestamps: true }
);

// Index for faster querying
snippetSchema.index({ author: 1 });
snippetSchema.index({ sessionId: 1 });
snippetSchema.index({ fileName: 1 });
snippetSchema.index({ sessionId: 1, author: 1, fileName: 1 }); // Compound index for efficient querying
snippetSchema.index({ language: 1 });
snippetSchema.index({ isPublic: 1 });
snippetSchema.index({ createdAt: -1 });

export default mongoose.model("Snippet", snippetSchema);