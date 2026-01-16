import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: false, // Make email optional since Clerk might not always provide it
      unique: false, // Remove unique constraint to allow empty emails
      lowercase: true,
      trim: true
    },
    username: {
      type: String,
      unique: true, // Keep unique for user identification
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    avatar: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light'
      },
      fontSize: {
        type: Number,
        default: 14
      },
      language: {
        type: String,
        default: 'javascript'
      }
    }
  },
  { timestamps: true }
);

// Method to update last login time
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

export default mongoose.model("User", userSchema);