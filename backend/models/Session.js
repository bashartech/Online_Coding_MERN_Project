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
      type: String,  // Store Clerk user ID as string instead of ObjectId
      required: true
    },
    collaborators: [
      {
        type: String  // Store Clerk user IDs as strings instead of ObjectId
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
      type: String,
      unique: true, // Ensure access codes are unique
      sparse: true  // Allow null values for existing sessions without access codes
    },
    code: {
      type: String,
      default: "console.log('Hello World');",
      maxlength: 10000 // Limit to 10,000 characters as per requirements
    }
  },
  { timestamps: true }
);

// Index for faster querying
sessionSchema.index({ sessionKey: 1 });
sessionSchema.index({ ownerId: 1 });
sessionSchema.index({ isActive: 1 });
sessionSchema.index({ accessCode: 1 }); // Index for access code lookups
sessionSchema.index({ createdAt: -1, isActive: 1 }); // For fast session queries as specified in Step 8

export default mongoose.model("Session", sessionSchema);