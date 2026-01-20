---
name: "session-sharing"
description: "Implement secure session sharing functionality with access codes for real-time collaboration. Creates endpoints for generating and validating access codes, join pages, and proper authentication flows. Use when adding session sharing to collaboration platforms."
version: "1.0.0"
---

# Session Sharing Implementation Skill

## When to Use This Skill
- Adding secure session sharing to a real-time collaboration platform
- Implementing access code generation for controlled sharing
- Creating join pages for users to access shared sessions
- Setting up proper authentication flows for session access
- Building real-time collaboration features with controlled access

## Procedure

### 1. Database Schema Updates
- Add `accessCode` field to session model with unique constraint
- Add `fileName` field to snippet/model for file-specific storage
- Create appropriate indexes for efficient access code lookups

### 2. Backend API Implementation
- Create endpoint for generating unique access codes (POST /api/sessions/:sessionId/generate-access-code)
- Create endpoint for getting session by access code (GET /api/sessions/access/:accessCode)
- Implement access code validation with proper authentication checks
- Update session controller with access code functions

### 3. Socket Authentication Enhancement
- Add socket event handler for joining via access code ('join-session-via-code')
- Implement proper authorization checks for access code joining
- Update session joining logic to handle access code validation
- Add user to collaborators list when joining via access code

### 4. Frontend Components
- Create ShareSessionModal component with copy-to-clipboard functionality
- Implement JoinSessionPage for users accessing via access codes
- Add share functionality to session editor with access code generation
- Update session editor to handle access code joining flow

### 5. Router Configuration
- Add route for join session page (/session/join/:accessCode)
- Configure API route for access code validation (/api/sessions/access/:accessCode)
- Ensure access code route doesn't require authentication

### 6. Security Considerations
- Generate cryptographically secure access codes (8+ character alphanumeric)
- Implement rate limiting for access code generation
- Validate user authentication before allowing session joining
- Add user to collaborators list upon successful access code join

### 7. Real-time Updates
- Ensure session joining via access code works with existing real-time features
- Verify code editing and chat functionality works for access code joiners
- Maintain presence indicators for users who joined via access code

## Implementation Steps

### Step 1: Update Session Model
```javascript
// Add accessCode field to Session model
accessCode: {
  type: String,
  unique: true,
  sparse: true  // Allow null values for existing sessions
},
// Add index for efficient access code lookups
sessionSchema.index({ accessCode: 1 });
```

### Step 2: Create API Endpoints
```javascript
// In session controller
export const generateAccessCode = async (req, res) => {
  // Generate unique 8-character alphanumeric code
  // Validate user owns session
  // Update session with access code
};

export const getSessionByAccessCode = async (req, res) => {
  // Find session by access code
  // Return session info without sensitive data
};
```

### Step 3: Update Socket Events
```javascript
// In server.js
socket.on('join-session-via-code', async (data) => {
  // Validate access code
  // Check user authentication
  // Add user to collaborators if not already there
  // Join socket room
});
```

### Step 4: Create Frontend Components
- ShareSessionModal: Displays access code and shareable link
- JoinSessionPage: Handles access code validation and session joining
- Update SessionEditorWrapper: Add share functionality

### Step 5: Configure Routes
- Add `/session/join/:accessCode` route to public pages
- Add `/api/sessions/access/:accessCode` to API routes without auth middleware

## Quality Criteria
- Access codes must be cryptographically secure and unique
- Join flow should maintain all real-time collaboration features
- Authentication must be verified before allowing access
- Users joining via access code should have same permissions as collaborators
- Error handling should be graceful with clear user feedback
- Security measures should prevent unauthorized access

## Example Usage
**Input**: User wants to share a coding session with a colleague
**Process**:
1. User clicks "Share Session" button
2. System generates unique access code and shareable link
3. User shares link: http://example.com/session/join/ABC123XYZ
4. Colleague clicks link and authenticates
5. Colleague joins session with full collaboration access
**Output**: Secure, authenticated collaboration with proper access controls