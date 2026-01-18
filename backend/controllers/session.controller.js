import Session from '../models/Session.js';
import Snippet from '../models/Snippet.js';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating session keys

/**
 * Create a new coding session
 */
export const createSession = async (req, res) => {
  try {
    // Extract user ID from Clerk middleware (req.auth() as an async function)
    const auth = await req.auth();
    const userId = auth.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    // Create session with default values
    const session = new Session({
      title: `Session ${new Date().toLocaleDateString()}`,
      description: '',
      ownerId: userId,
      collaborators: [],
      isPublic: false,
      language: 'javascript', // Default language
      maxParticipants: 10,
      isActive: true,
      sessionKey: uuidv4(), // Generate unique session key
      accessCode: null,
      code: "console.log('Hello World');" // Default starter code
    });

    await session.save();

    res.status(201).json({
      sessionId: session._id.toString(),
      sessionKey: session.sessionKey,
      success: true
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create session'
    });
  }
};

/**
 * Get a specific session by ID
 */
export const getSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const auth = await req.auth();
    const userId = auth.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    // Verify user owns the session
    if (session.ownerId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to this session'
      });
    }

    // Retrieve file-specific code snippets for this user in this session
    const userSnippets = await Snippet.find({
      sessionId: session.sessionKey, // Use sessionKey to match the Snippet schema
      author: userId
    });

    // Convert to a map of fileName -> { code, language }
    const files = {};
    userSnippets.forEach(snippet => {
      files[snippet.fileName] = {
        code: snippet.content,
        language: snippet.language
      };
    });

    res.status(200).json({
      sessionId: session._id.toString(),
      sessionKey: session.sessionKey,
      title: session.title,
      code: session.code || '', // Return existing code or empty string,
      language: session.language,
      files: files, // Include file-specific data
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve session'
    });
  }
};

/**
 * Update a specific session by ID
 */
export const updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code, language, title } = req.body;
    const auth = await req.auth();
    const userId = auth.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    // Verify user owns the session
    if (session.ownerId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to this session'
      });
    }

    // Handle file-specific updates if provided
    if (req.body.files) {
      // Process each file in the files object
      for (const [fileName, fileData] of Object.entries(req.body.files)) {
        // Validate code length (max 10,000 characters)
        if (fileData.code && fileData.code.length > 10000) {
          return res.status(400).json({
            error: 'Bad Request',
            message: `Code for ${fileName} exceeds maximum length of 10,000 characters`
          });
        }

        // Find or update snippet for this specific file
        let snippet = await Snippet.findOne({
          sessionId: session.sessionKey,
          author: userId,
          fileName: fileName
        });

        if (snippet) {
          // Update existing snippet
          snippet.content = fileData.code || snippet.content;
          snippet.language = fileData.language || snippet.language;
          await snippet.save();
        } else {
          // Create new snippet
          snippet = new Snippet({
            title: `Code by ${userId} - ${fileName}`,
            content: fileData.code || '',
            language: fileData.language || 'javascript',
            fileName: fileName,
            author: userId,
            sessionId: session.sessionKey
          });
          await snippet.save();
        }
      }
    }

    // Update other allowed fields in the session
    if (code !== undefined) {
      // Validate code length (max 10,000 characters)
      if (code.length > 10000) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Code exceeds maximum length of 10,000 characters'
        });
      }
      session.code = code;
    }

    if (language !== undefined) {
      // Validate language is in the allowed enum
      const allowedLanguages = ['javascript', 'python', 'java', 'cpp', 'c', 'html', 'css', 'typescript', 'go', 'rust', 'php', 'ruby', 'sql'];
      if (allowedLanguages.includes(language)) {
        session.language = language;
      }
    }

    if (title !== undefined) {
      session.title = title;
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update session'
    });
  }
};

/**
 * Get all sessions for the authenticated user
 */
export const getUserSessions = async (req, res) => {
  try {
    const auth = await req.auth();
    const userId = auth.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const sessions = await Session.find({
      ownerId: userId,
      isActive: true
    }).sort({ updatedAt: -1 }); // Sort by most recently updated

    const sessionList = sessions.map(session => ({
      sessionId: session._id.toString(),
      title: session.title,
      updatedAt: session.updatedAt,
      language: session.language,
      isActive: session.isActive
    }));

    res.status(200).json(sessionList);
  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user sessions'
    });
  }
};

/**
 * Delete a specific session by ID
 */
export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const auth = await req.auth();
    const userId = auth.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    // Verify user owns the session
    if (session.ownerId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to this session'
      });
    }

    // Mark session as inactive (soft delete) or delete permanently
    await Session.findByIdAndUpdate(sessionId, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete session'
    });
  }
};