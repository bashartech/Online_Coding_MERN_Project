
import { requireAuth } from "@clerk/express";

const clerkAuth = requireAuth({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

const authMiddleware = async (req, res, next) => {
  console.log("=== AUTH MIDDLEWARE DEBUG ===");
  console.log("Full Request URL:", req.originalUrl || req.url);
  console.log("Base Request URL:", req.url);
  console.log("Method:", req.method);
  console.log("Headers:", Object.keys(req.headers));
  console.log("Authorization Header Present:", !!req.headers.authorization);
  if (req.headers.authorization) {
    const tokenParts = req.headers.authorization.split(' ');
    if (tokenParts.length === 2 && tokenParts[0] === 'Bearer') {
      const token = tokenParts[1];
      console.log("Token Length:", token.length);
      console.log("Token Start:", token.substring(0, 30) + "...");
      // Decode JWT header to check algorithm and type
      try {
        const headerPart = token.split('.')[0];
        const decodedHeader = JSON.parse(Buffer.from(headerPart, 'base64').toString('utf-8'));
        console.log("JWT Header:", decodedHeader);
      } catch (e) {
        console.log("Could not decode JWT header:", e.message);
      }
    }
  }

  // Check if this is the intended API route
  console.log("Is this the intended route?", req.url.includes('sessions'));
  console.log("Environment Keys Loaded:", {
    hasSecretKey: !!process.env.CLERK_SECRET_KEY,
    hasPublishableKey: !!process.env.CLERK_PUBLISHABLE_KEY,
    secretKeyLength: process.env.CLERK_SECRET_KEY?.length,
    publishableKeyLength: process.env.CLERK_PUBLISHABLE_KEY?.length
  });

  clerkAuth(req, res, async (err) => {
    if (err) {
      console.error("Clerk middleware error:", err);
      return res.status(401).json({
        error: "Unauthorized",
        message: "Clerk authentication error",
      });
    }

    try {
      // ✅ MUST await
      const auth = await req.auth();
 
      console.log("=== CLERK AUTH RESOLVED ===");
      console.log("Full Auth Object Keys:", Object.keys(auth || {}));
      console.log("Auth Object Type:", typeof auth);
      console.log("User ID:", auth?.userId);
      console.log("Is Authenticated:", auth?.isAuthenticated);
      console.log("Session Status:", auth?.sessionStatus);
      console.log("Session ID:", auth?.sessionId);
      console.log("Token Type:", auth?.tokenType);
      console.log("Has Claims:", !!auth?.sessionClaims);

      if (auth?.sessionClaims) {
        console.log("Session Claims Keys:", Object.keys(auth.sessionClaims));
        console.log("Session Claims Sub (User ID):", auth.sessionClaims.sub);
        console.log("Session Claims SID (Session ID):", auth.sessionClaims.sid);
        console.log("Session Claims Org ID:", auth.sessionClaims.org_id);
      }

      if (!auth || !auth.isAuthenticated || !auth.userId) {
        console.log("=== AUTHENTICATION FAILED ===");
        console.log("Failure Details:");
        console.log("- isAuthenticated:", auth?.isAuthenticated);
        console.log("- userId:", auth?.userId);
        console.log("- sessionId:", auth?.sessionId);
        console.log("- sessionStatus:", auth?.sessionStatus);

        return res.status(401).json({
          error: "Unauthorized",
          message: "User not authenticated",
          details: {
            isAuthenticated: auth?.isAuthenticated,
            userId: auth?.userId,
            sessionId: auth?.sessionId,
            sessionStatus: auth?.sessionStatus,
            tokenType: auth?.tokenType
          }
        });
      }

      // attach for controllers
      req.userId = auth.userId;
      req.sessionId = auth.sessionId; // Also attach session ID if available

      console.log("=== AUTHENTICATION SUCCESSFUL ===");
      console.log("Authenticated User ID:", auth.userId);
      console.log("Session ID:", auth.sessionId);
      next();
    } catch (error) {
      console.error("Auth resolution error:", error);
      console.error("Resolution Error Details:", {
        message: error.message,
        stack: error.stack
      });
      return res.status(401).json({
        error: "Unauthorized",
        message: "Failed to resolve auth",
        errorDetails: error.message
      });
    }
  });
};

export default authMiddleware;
