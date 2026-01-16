# Day 2 – Code Editor & Session Management Specification

## Feature Name

**Code Editor Integration & Session Management**

## Purpose

Enable users to create coding sessions, write/edit code in a rich editor (Monaco), and persist their work securely in MongoDB. This feature is foundational for collaborative and AI-assisted coding workflows.

---

## Scope

This specification covers:

* Integration of **Monaco Editor** in React
* Session lifecycle management (Create, Read, Update, Delete)
* Saving & loading code snippets from MongoDB
* Backend APIs for session persistence
* Frontend components and state flow

> ❗ Out of Scope (for Day 2)

* Real-time collaboration
* Version history / diffing
* AI code generation

---

## Existing Assets (Must Be Used)

### 1. Frontend Editor Component

* **File:** `codeEditor.tsx`
* **Description:**

  * A reusable Monaco Editor component
  * Must be imported and used, not rewritten
  * Supports language selection, theme, and controlled value

> ⚠️ This spec assumes `codeEditor.tsx` already contains a working Monaco Editor setup.

### 2. Database Schema

* A **Session schema already exists**
* This schema **must be reviewed first**
* Only update the schema if required fields are missing

---

## Pre-Implementation Checklist (Mandatory Reading)

Before starting **any implementation** for Day 2, the developer **must first review and verify** the following:

### 1. Project Structure Review

* Understand the complete **frontend folder structure**
* Understand the complete **backend folder structure**
* Identify where:

  * API routes live
  * Controllers live
  * Models/Schemas live
  * Middleware lives

### 2. Authentication Flow (Clerk)

* Review full authentication flow:

  * Clerk Sign Up
  * Clerk Sign In
  * Redirect to Dashboard
* Confirm `useUser()` is already providing:

  * `user.id`
  * `user.emailAddresses`
* Confirm Clerk auth middleware is already protecting backend routes

⚠️ **Important:**

* Do NOT reimplement authentication
* Reuse existing Clerk + JWT flow
* Session APIs must assume user is already authenticated

### 3. Database & Schema Review

* Review existing MongoDB connection setup
* Review existing Session schema
* Confirm fields like:

  * `userId`
  * `code`
  * `language`
  * `createdAt`
  * `updatedAt`

Only update schema **if absolutely required** for editor/session logic.

---

## User Flow (End-to-End)

### Step-by-Step Flow

1. User logs in and lands on **Dashboard**
2. Dashboard displays:

   * **Create New Session** button
   * List of **Previous Sessions**
3. User clicks **Create New Session**
4. Frontend calls backend to create a new session
5. Backend creates a session record in MongoDB
6. Backend returns `sessionId`
7. Frontend redirects user to:

   ```
   /session/:sessionId
   ```
8. Session Editor page loads
9. `codeEditor.tsx` is rendered with:

   * Default starter code (new session)
   * OR previously saved code (existing session)
10. User writes or edits code
11. User clicks **Save Code**
12. Frontend sends updated code to backend
13. Backend updates session record in MongoDB
14. User can:

* Refresh page (code persists)
* Go back to Dashboard
* Reopen the session later

---

## Functional Requirements

### 1. Session Management (CRUD)

#### Create Session

* Triggered when user clicks **New Session**
* Backend generates:

  * `sessionId`
  * `createdAt`
* Stores default editor state

#### Read Session

* Load session data by `sessionId`
* Populate editor with saved code

#### Update Session

* Update code content
* Update `updatedAt` timestamp

#### Delete Session (Optional for Day 2)

* Soft delete preferred
* Hard delete allowed if schema supports it

---

## Code Editor Requirements

### Editor Library

* **Monaco Editor** (preferred)
* CodeMirror allowed only as fallback

### Editor Component Usage

* Must use:

  ```ts
  codeEditor.tsx
  ```
* Responsibilities of `codeEditor.tsx`:

  * Render Monaco Editor
  * Accept props:

    * `value` (string)
    * `onChange` (callback)
    * `language`
    * `readOnly`

### Editor State

* Editor must be **controlled** by parent component
* Parent component manages:

  * Current code
  * Save status

---

## Backend API Specification

### Base Path

```
/api/sessions
```

### Endpoints

#### 1. Create Session

```
POST /api/sessions
```

**Description:**

* Creates a new empty coding session
* Called from Dashboard when user clicks **New Session**

**Response:**

```json
{
  "sessionId": "string"
}
```

---

#### 2. Get All Sessions

```
GET /api/sessions
```

**Description:**

* Fetches all previous sessions for the logged-in user
* Used to populate Dashboard session list

**Response:**

```json
[
  {
    "sessionId": "string",
    "updatedAt": "date",
    "language": "javascript"
  }
]
```

---

#### 3. Get Single Session

```
GET /api/sessions/:sessionId
```

**Description:**

* Fetches session data when opening editor

**Response:**

```json
{
  "sessionId": "string",
  "code": "string",
  "language": "javascript",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

#### 4. Update Session

```
PUT /api/sessions/:sessionId
```

**Description:**

* Saves code written in editor

**Body:**

```json
{
  "code": "string"
}
```

---

#### 5. Delete Session (Optional)

```
DELETE /api/sessions/:sessionId
```

---

#### 2. Get Session

```
GET /api/sessions/:sessionId
```

**Response:**

```json
{
  "sessionId": "string",
  "code": "string",
  "language": "javascript",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

#### 3. Update Session

```
PUT /api/sessions/:sessionId
```

**Body:**

```json
{
  "code": "string"
}
```

---

#### 4. Delete Session (Optional)

```
DELETE /api/sessions/:sessionId
```

---

## Database Schema Review

### Existing Schema (To Be Read First)

The existing schema **must be inspected** before any changes.

### Required Fields

Ensure the schema includes:

* `sessionId` (string, unique)
* `code` (string)
* `language` (string)
* `createdAt` (date)
* `updatedAt` (date)
* `userId` (optional but recommended)

### Schema Update Rules

* ❌ Do NOT create a new schema unnecessarily
* ✅ Only add fields if missing
* ✅ Maintain backward compatibility

---

## Frontend Architecture

### Dashboard Page

**Route:** `/dashboard`

**Responsibilities:**

* Display **Create New Session** button
* Display list of all previous sessions for the user

**UI Elements:**

* `+ New Session` button
* Session cards or list items showing:

  * Session name or ID
  * Last updated time
  * Open session action

**Actions:**

* Clicking **New Session** → calls `POST /api/sessions`
* Clicking a session → navigates to `/session/:sessionId`

---

### Editor Page

**Route:** `/session/:sessionId`

**Responsibilities:**

* Load session data from backend
* Render code editor
* Handle save functionality

---

### Components

#### 1. `DashboardSessions.tsx`

* Fetches all sessions for the user
* Renders session list
* Handles create-session action

#### 2. `CodeEditorWrapper.tsx`

* Page-level component
* Fetches session data by `sessionId`
* Controls editor state
* Handles save logic

#### 3. `codeEditor.tsx`

* Pure Monaco Editor component
* No API or session logic
* Receives code and callbacks via props

---

## State Management

### Local State (Day 2)

* React `useState`
* `useEffect` for loading session

### Data Flow

```
MongoDB → API → Page → CodeEditor
```

---

## Error Handling

* Invalid `sessionId` → 404
* Failed save → toast / alert
* Network failure → retry option

---

## Security Considerations

* Validate `sessionId`
* Prevent unauthorized access (auth integration later)
* Sanitize code input before storage

---

## Deliverables (Day 2)

✅ Dashboard shows **Create Session** button

✅ Dashboard lists all previous sessions

✅ Clicking a session opens editor

✅ Monaco Editor integrated via `codeEditor.tsx`

✅ Session CRUD APIs working

✅ Code saved & loaded from MongoDB

✅ User can:

* Create a session from Dashboard
* View all previous sessions
* Open editor
* Write code
* Save code
* Reopen session later

---

## Acceptance Criteria

* Session creation starts only from Dashboard
* Previous sessions always visible on Dashboard
* No duplicate editor implementations
* Existing schema reused
* Clean separation of editor & data logic
* Code persists after refresh

---

## Detailed Implementation Plan (Day 2)

This plan must be followed **step by step**. No step should be skipped.

---

## Phase 0 – Mandatory Review (Before Coding)

### 0.1 Review Authentication (Clerk)

* Confirm Clerk is already configured in frontend
* Verify:

  * `ClerkProvider` is wrapping the app
  * `useUser()` is working on Dashboard
* Ensure backend routes are protected via Clerk middleware
* Confirm JWT verification is already functional

⚠️ Session APIs must **not** handle login/signup logic.

---

### 0.2 Review Existing Database Setup

* Verify MongoDB Atlas connection string
* Confirm `mongoose.connect()` is centralized
* Ensure DB connects before server starts

---

### 0.3 Review Existing Session Schema

**Required fields (must already exist or be added):**

```ts
SessionSchema {
  userId: string        // Clerk userId
  title?: string        // Optional session title
  language: string      // javascript | typescript | etc
  code: string          // Code content
  createdAt: Date
  updatedAt: Date
}
```

Rules:

* `userId` must come from Clerk
* `code` defaults to starter template
* Do NOT store tokens in DB

---

## Phase 1 – Backend Implementation

### 1.1 Create Session API

**Endpoint:**

```
POST /api/sessions
```

**Logic:**

1. Extract authenticated `userId`
2. Create new session document
3. Insert default starter code
4. Save to MongoDB
5. Return `sessionId`

---

### 1.2 Get All Sessions (Dashboard)

**Endpoint:**

```
GET /api/sessions
```

**Logic:**

1. Get `userId` from auth middleware
2. Query sessions by `userId`
3. Sort by `updatedAt desc`
4. Return minimal session info

---

### 1.3 Get Single Session (Editor Load)

**Endpoint:**

```
GET /api/sessions/:sessionId
```

**Validation:**

* Session must belong to authenticated user

---

### 1.4 Update Session (Save Code)

**Endpoint:**

```
PUT /api/sessions/:sessionId
```

**Logic:**

1. Validate ownership
2. Update `code`
3. Update `updatedAt`
4. Save

---

### 1.5 Optional Delete Session

**Endpoint:**

```
DELETE /api/sessions/:sessionId
```

---

## Phase 2 – Frontend Implementation

### 2.1 Dashboard

**Responsibilities:**

* Fetch all user sessions
* Render list
* Provide `Create Session` button

**Flow:**

1. Click `Create Session`
2. Call POST `/api/sessions`
3. Redirect to `/session/:id`

---

### 2.2 Session Editor Page

**Route:**

```
/session/:sessionId
```

**Responsibilities:**

* Fetch session data
* Render editor
* Handle save

---

### 2.3 Editor Integration (`codeEditor.tsx`)

Rules:

* Must remain a pure editor component
* Receives:

  * `value`
  * `onChange`
* No API calls inside

---

## Phase 3 – Data Flow Summary

```
Clerk Auth → Dashboard → Create Session → MongoDB
                          ↓
                     Open Editor
                          ↓
                    Save Code
```

---

## Phase 4 – Validation & Testing

### Functional Checks

* Create session
* Reload editor
* Save code
* Reopen session

### Security Checks

* User cannot access others' sessions
* All APIs require authentication

---

## Phase 5 – Completion Criteria

Day 2 is complete when:

* Sessions are user-scoped
* Code persists in DB
* Editor loads saved code
* No auth duplication

---

## Notes for Day 3

* Auto-save
* Version history
* AI-assisted code
