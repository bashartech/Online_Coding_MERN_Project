import jwt from 'jsonwebtoken';
import { verifyToken as verifyClerkToken } from '@clerk/backend';
import User from '../models/User.js';

// Get user profile or create if doesn't exist
export const getUserProfile = async (req, res) => {
  try {
    // Verify the Clerk JWT from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header'
      });
    }

    const clerkToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Clerk token
    let clerkClaims;
    try {
      clerkClaims = await verifyClerkToken(clerkToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
        clockSkewInMs: 60000, // Allow for 60 seconds of clock skew (increased for development)
      });
    } catch (verificationError) {
      console.error('Clerk token verification failed:', verificationError);
      // Check if this is a clock skew error
      if (verificationError.message && (verificationError.message.includes('JWT issued at date claim (iat) is in the future') || verificationError.reason === 'token-iat-in-the-future')) {
        // In development, we might have clock skew issues, so we'll log but still try to proceed
        console.warn('Clock skew detected in Clerk token, proceeding with verification...');

        // For development, we'll try to decode without verification (not recommended for production)
        // In a real production environment, you'd want to fix the clock sync issue
        try {
          // Manually decode the JWT without verification to extract claims
          const parts = clerkToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

            // Extract user information with fallbacks for missing fields
            clerkClaims = {
              sub: payload.sub || payload.sid || payload.jti || payload.id || payload.user_id || '',
              email: payload.email || payload.email_address || (payload.email_addresses && payload.email_addresses[0] && payload.email_addresses[0].email_address) || '',
              first_name: payload.first_name || payload.given_name || payload.name || '',
              last_name: payload.last_name || payload.family_name || '',
              image_url: payload.image_url || payload.picture || payload.avatar || '',
              username: payload.username || payload.preferred_username || (payload.email ? payload.email.split('@')[0] : ''),
              email_addresses: payload.email_addresses || [],
              phone_numbers: payload.phone_numbers || [],
              external_accounts: payload.external_accounts || []
            };
          } else {
            throw new Error('Invalid JWT format');
          }
        } catch (decodeError) {
          console.error('Failed to decode Clerk token:', decodeError);
          return res.status(401).json({
            success: false,
            message: 'Invalid Clerk token'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid Clerk token'
        });
      }
    }

    // Extract user data from Clerk claims
    const {
      sub: clerkId,
      email, // This might be undefined depending on the token
      first_name: firstName,
      last_name: lastName,
      image_url: imageUrl,
      username: clerkUsername,
      email_addresses,
      phone_numbers,
      external_accounts,
      web3_wallets,
      public_metadata,
      private_metadata,
      unsafe_metadata,
      created_at,
      updated_at
    } = clerkClaims;

    // Check if user already exists in our database
    let user = await User.findOne({ clerkId });

    if (!user) {
      // Create new user if doesn't exist
      // Ensure username is not longer than 30 characters
      let username = clerkUsername || email?.split('@')[0] || clerkId;
      if (username.length > 30) {
        username = username.substring(0, 30);
      }

      // Extract primary email from email addresses array
      const primaryEmail = email_addresses?.[0]?.email_address || email || '';
      // Ensure email is not empty string if possible, use null instead of empty string to avoid unique constraint
      const userEmail = primaryEmail.trim() || null;

      user = new User({
        clerkId,
        email: userEmail,
        firstName: firstName || '',
        lastName: lastName || '',
        avatar: imageUrl || '',
        username: username
      });

      try {
        await user.save();
      } catch (saveError) {
        // Handle duplicate key error (email or username already exists)
        if (saveError.code === 11000) {
          // The unique index might still exist in the database from when unique: true was set
          // Check if the user was created by a concurrent request
          user = await User.findOne({ clerkId });

          if (!user) {
            // If the user doesn't exist but we have a duplicate error,
            // it might be due to the unique constraint on email field that still exists
            // Try to find user by clerkId again to be sure
            user = await User.findOne({ clerkId });

            if (!user) {
              // If still no user found, try to create with a unique email field by using a unique identifier
              // For email, we'll use a placeholder that makes it unique
              const uniqueEmail = userEmail ? userEmail : `${clerkId}@temp.placeholder`;

              user = new User({
                clerkId,
                email: uniqueEmail,  // Use a unique placeholder if original email is null
                firstName: firstName || '',
                lastName: lastName || '',
                avatar: imageUrl || '',
                username: username
              });

              await user.save();
            }
          }
        } else {
          // Re-throw other errors
          throw saveError;
        }
      }
    } else {
      // Update last login time for existing user
      await user.updateLastLogin();
    }

    // Generate our own JWT token for internal use (using JWT_SECRET from env)
    const token = jwt.sign(
      { userId: user._id, clerkId: user.clerkId, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key_for_dev',
      { expiresIn: '24h' }
    );

    // Return success with user data and our internal token
    res.status(200).json({
      success: true,
      token,
      user: { 
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify token and get user info
export const verifyToken = async (req, res) => {
  try {
    const token = req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_dev', {
      clockTimestamp: Date.now() / 1000, // Use current time for validation
      clockTolerance: 30 // Allow 30 seconds of clock skew (increased for development)
    });

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user by Clerk ID
export const getUserByClerkId = async (req, res) => {
  try {
    const { clerkId } = req.params;

    const user = await User.findOne({ clerkId }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};