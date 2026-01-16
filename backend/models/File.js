import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true
    },
    filename: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      default: "javascript",
      enum: ["javascript", "python", "java", "cpp", "c", "html", "css", "typescript", "go", "rust", "php", "ruby", "sql"]
    },
    content: {
      type: String,
      default: ""
    },
    version: {
      type: Number,
      default: 1
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isMainFile: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for faster querying
fileSchema.index({ sessionId: 1 });
fileSchema.index({ filename: 1 });

export default mongoose.model("File", fileSchema);