import User from '../models/User.js';
import Session from '../models/Session.js';
import Snippet from '../models/Snippet.js';
import File from '../models/File.js';

// Create a new session
export const createSession = async (req, res) => {
  try {
    const { title, description, language, isPublic } = req.body;
    const userId = req.user.id; // Assuming user is authenticated

    // Create new session
    const session = new Session({
      title,
      description,
      ownerId: userId,
      language,
      isPublic,
      sessionKey: Math.random().toString(36).substring(2, 10) // Generate unique session key
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Save/update code snippet
export const saveSnippet = async (req, res) => {
  try {
    const { title, content, language, sessionId } = req.body;
    const userId = req.user.id;

    // Create or update snippet
    const snippet = await Snippet.findOneAndUpdate(
      { sessionId, author: userId }, // Find existing snippet for this session
      { title, content, language, sessionId }, // Update with new content
      {
        new: true, // Return updated document
        upsert: true // Create if doesn't exist
      }
    );

    res.status(200).json({
      success: true,
      data: snippet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get session with associated snippets
export const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Populate session with owner info and related snippets
    const session = await Session.findById(sessionId)
      .populate('ownerId', 'username email firstName lastName')
      .populate({
        path: 'snippets',
        populate: {
          path: 'author',
          select: 'username'
        }
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Add collaborator to session
export const addCollaborator = async (req, res) => {
  try {
    const { sessionId, email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user to session collaborators
    const session = await Session.findByIdAndUpdate(
      sessionId,
      { $addToSet: { collaborators: user._id } }, // $addToSet prevents duplicates
      { new: true }
    ).populate('collaborators', 'username email');

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};