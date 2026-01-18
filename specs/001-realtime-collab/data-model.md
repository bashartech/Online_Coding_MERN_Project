# Data Model: Real-Time Collaboration

## Overview
This document outlines the data models required for implementing real-time collaboration functionality. The design extends existing models where possible to maintain consistency with the existing codebase.

## Entity: Session
**Purpose**: Represents a collaborative coding workspace with access control

### Fields
- `_id`: ObjectId (Primary Key)
- `title`: String (Session name/title)
- `description`: String (Session description)
- `ownerId`: String (Clerk user ID as string - owner of the session)
- `collaborators`: Array of Strings (Clerk user IDs of users who can access this session)
- `isPublic`: Boolean (Whether the session is publicly accessible)
- `language`: String (Default programming language for the session)
- `maxParticipants`: Number (Maximum number of participants allowed)
- `isActive`: Boolean (Whether the session is currently active)
- `sessionKey`: String (Unique identifier for the session - indexed)
- `accessCode`: String (Optional access code for session)
- `code`: String (Current code content in the session)
- `createdAt`: Date (Timestamp when session was created)
- `updatedAt`: Date (Timestamp when session was last modified)

### Validation Rules
- `ownerId` must reference a valid User document
- All `collaborators` must reference valid User documents
- `ownerId` cannot be duplicated in `collaborators` array
- `collaborators` array should not exceed maximum allowed collaborators (e.g., 10 per session)

### Relationships
- One-to-many relationship with User (as owner)
- Many-to-many relationship with User (as collaborators)
- One-to-one relationship with Code

## Entity: Code/CodeSnippet (represented by Snippet model)
**Purpose**: Represents the code content that is being edited collaboratively

### Fields
- `_id`: ObjectId (Primary Key)
- `title`: String (Title of the snippet)
- `description`: String (Description of the snippet)
- `content`: String (The actual code content - required)
- `language`: String (Programming language for syntax highlighting, default: "javascript")
- `author`: ObjectId (Reference to User who authored the snippet - required)
- `sessionId`: ObjectId (Reference to the Session this code belongs to)
- `isPublic`: Boolean (Whether the snippet is publicly accessible)
- `tags`: Array of Strings (Tags for organizing snippets)
- `likes`: Number (Count of likes for the snippet)
- `likedBy`: Array of ObjectIds (References to Users who liked the snippet)
- `createdAt`: Date (Timestamp when snippet was created)
- `updatedAt`: Date (Timestamp when snippet was last updated)

### Validation Rules
- `content` should have reasonable size limits (e.g., max 1MB)
- `language` must be from a predefined list of supported languages
- `version` should increment with each update

### Relationships
- Many-to-one relationship with Session
- Many-to-one relationship with User (last modifier)

## Entity: User
**Purpose**: Represents authenticated users who can participate in collaboration sessions

### Fields
- `_id`: ObjectId (Primary Key)
- `clerkId`: String (Clerk user ID - required and unique)
- `email`: String (User's email address - optional)
- `username`: String (Display name for the user - unique)
- `firstName`: String (User's first name)
- `lastName`: String (User's last name)
- `avatar`: String (URL to user's avatar image)
- `role`: String (User role: "user" or "admin", default: "user")
- `isActive`: Boolean (Whether the user account is active)
- `lastLoginAt`: Date (Timestamp of last login)
- `preferences`: Object (User preferences including theme, fontSize, language)
- `createdAt`: Date (Account creation timestamp)
- `updatedAt`: Date (Timestamp when user was last updated)

### Validation Rules
- `email` must be unique and valid
- `username` must be unique within the system

### Relationships
- One-to-many relationships with Session (as owner)
- Many-to-many relationships with Session (as collaborator)
- One-to-many relationships with Code (as last modifier)

## Entity: Presence
**Purpose**: Tracks user activity status in real-time collaboration sessions (transient data)

### Fields
- `userId`: ObjectId (Reference to User)
- `sessionId`: ObjectId (Reference to Session)
- `socketId`: String (Current socket ID for the user)
- `lastActive`: Date (Last activity timestamp)
- `isOnline`: Boolean (Current online status)

### Validation Rules
- Combination of `userId` and `sessionId` should be unique
- `socketId` should be valid and currently connected

### Relationships
- Many-to-one relationship with User
- Many-to-one relationship with Session

## State Transitions

### Session States
- `CREATED` → `ACTIVE` when first user joins
- `ACTIVE` → `INACTIVE` when last user leaves or after period of inactivity
- `ACTIVE` → `ARCHIVED` when explicitly archived by owner

### Code Versioning
- Each `code-change` event increments the `version` field
- Conflict resolution uses timestamp-based ordering if needed
- History can be maintained by storing previous versions

### User Presence States
- `OFFLINE` → `ONLINE` when user joins session via `join-session` event
- `ONLINE` → `OFFLINE` when user leaves or disconnects
- Status updates triggered by `presence-update` events