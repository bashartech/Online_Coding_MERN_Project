# Data Model: Code Editor & Session Management

## Session Entity

### Current Schema (Extended)
Based on the existing `/backend/models/Session.js` with extensions for code content:

```javascript
{
  _id: ObjectId,                    // MongoDB-generated unique identifier
  title: String (required),         // Title of the session
  description: String,              // Optional description
  ownerId: ObjectId (ref: "User"),  // Clerk user ID that owns the session
  collaborators: [ObjectId],        // Array of user IDs with access
  isPublic: Boolean,                // Whether session is publicly accessible
  language: String,                 // Programming language (enum)
  maxParticipants: Number,          // Maximum number of participants
  isActive: Boolean,                // Whether session is active
  sessionKey: String (unique),      // Unique key to identify the session
  accessCode: String,               // Optional access code for restricted sessions
  codeContent: String,              // [NEW] The actual code content (10KB max)
  createdAt: Date,                  // Timestamp when session was created
  updatedAt: Date                   // Timestamp when session was last modified
}
```

### Field Specifications

#### Required Extensions
- **codeContent**: String field to store the actual code content
  - Max length: 10,000 characters (as per success criteria)
  - Default: "console.log('Hello World');"
  - Required: Yes for code sessions

#### Existing Fields Utilization
- **language**: Already supports multiple languages (12 in enum)
  - Values: "javascript", "python", "java", "cpp", "c", "html", "css", "typescript", "go", "rust", "php", "ruby", "sql"
  - Default: "javascript"
- **ownerId**: Links to User model for ownership and access control
- **sessionKey**: Primary identifier for accessing sessions via URL
- **timestamps**: Automatically managed createdAt/updatedAt fields

### Indexes
- `sessionKey`: For fast lookup by session identifier
- `ownerId`: For fast retrieval of user's sessions
- `isActive`: For filtering active sessions
- `[ownerId, isActive]`: Compound index for user's active sessions (NEW)

### Validation Rules
- `codeContent.length <= 10000`: Maximum character limit
- `language` must be in the allowed enum values
- `sessionKey` must be unique across all sessions
- `ownerId` must reference a valid User document
- `title` is required and trimmed of whitespace

### Relationships
- **One-to-Many**: User to Sessions (one user can own many sessions)
- **Many-to-Many**: Users to Sessions (collaborators relationship)

## Session Operations

### Create Session
- Generates unique `sessionKey`
- Sets `ownerId` to authenticated user
- Initializes `codeContent` with default sample code
- Sets `language` to "javascript" by default
- Sets `isActive` to true
- `createdAt` and `updatedAt` auto-set by timestamps

### Read Session
- Verify `ownerId` matches authenticated user (or collaborator)
- Return all fields except sensitive information

### Update Session
- Verify `ownerId` matches authenticated user (or authorized collaborator)
- Update `codeContent`, `language`, or other editable fields
- `updatedAt` auto-updates via timestamps

### Delete Session
- Verify `ownerId` matches authenticated user
- Mark `isActive` as false (soft delete) or remove document (hard delete)

## Alternative Approaches Considered

### Separate Code Content Collection
Instead of extending the Session model, we could create a separate CodeContent collection. However, this would:
- Add complexity to queries
- Require joins for basic operations
- Increase the chance of data inconsistency

### Pros of Current Approach
- Simple, unified data access
- Single atomic operation for save/load
- Consistent with existing schema structure

### Cons of Current Approach
- May grow documents larger than typical
- Less flexibility for code-specific operations

The chosen approach balances simplicity with functionality, fitting well within the existing architecture.