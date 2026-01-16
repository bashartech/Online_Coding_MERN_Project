import { clerkMiddleware } from '@clerk/express';

// Use Clerk's built-in middleware for authentication
const clerkAuth = clerkMiddleware({
  // Configure your auth middleware here
  // This will verify the Clerk JWT and attach user info to req.auth
  secretKey: process.env.CLERK_SECRET_KEY,
});

export default clerkAuth; 