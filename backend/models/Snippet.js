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
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);

// Index for faster querying
snippetSchema.index({ author: 1 });
snippetSchema.index({ sessionId: 1 });
snippetSchema.index({ language: 1 });
snippetSchema.index({ isPublic: 1 });
snippetSchema.index({ createdAt: -1 });

export default mongoose.model("Snippet", snippetSchema);