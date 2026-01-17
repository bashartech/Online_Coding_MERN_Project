# ✅ Updated Implementation Tasks: Code Editor & Session Management (MERN)

**Feature**: Code Editor & Session Management
**Stack**: MERN (MongoDB, Express, React, Node.js)
**Auth**: Clerk
**Branch**: 1-code-editor-session
**Created**: 2026-01-16
**Status**: Approved Draft

## Phase 0: Mandatory Review (DO NOT SKIP)

- [X] T000 Review complete frontend & backend folder structure
- [X] T000.1 Review existing Clerk authentication flow (signup, signin, redirect)
- [X] T000.2 Verify Clerk middleware is already protecting Express APIs
- [X] T000.3 Review MongoDB connection and Mongoose setup
- [X] T000.4 Read existing Session schema BEFORE modifying anything

⚠️ No coding allowed before this phase is completed

## Phase 1: Setup (MERN-Only)

- [X] T001 Verify backend dependencies (express, mongoose, @clerk/express)
- [X] T002 Verify MongoDB connection is established before routes load
- [X] T003 Verify Clerk secret & publishable keys are configured
- [X] T004 Verify React Router is set up (NO Next.js assumptions)

## Phase 2: Foundational Backend Tasks

- [X] T010 Review existing Session schema in backend/models/Session.js
- [X] T011 Confirm schema has userId, code, language, timestamps
- [X] T012 Update schema ONLY if required (no blind changes)
- [X] T013 Set up session routes file backend/routes/session.routes.js
- [X] T014 Set up session controller backend/controllers/session.controller.js
- [X] T015 Verify Clerk auth middleware is applied to all session routes

## Phase 3: User Story 1 – Create New Coding Session (P1)

**Goal**: Authenticated user creates a session from Dashboard

**Acceptance Scenarios**:
- Clicking "Create Session" creates DB record
- User is redirected to editor page
- Editor loads with default starter code

**Tasks**:
- [X] T020 [P] [US1] Implement POST /api/sessions (Express controller)
- [X] T021 [P] [US1] Extract userId from Clerk middleware (NOT frontend)
- [X] T022 [US1] Create session with default code template
- [X] T023 [US1] Register route in session.routes.js
- [X] T024 [US1] Add "Create Session" button on Dashboard
- [X] T025 [US1] Redirect to /session/:sessionId (React Router)
- [X] T026 [US1] Create editor page component (NOT Next.js pages) or check codeEditor.tsx for simple code make it highly professional 

## Phase 4: User Story 2 – Save & Retrieve Code (P1)

**Acceptance Scenarios**:
- Code persists after refresh
- Updates overwrite previous code
- Only session owner can access

**Tasks**:
- [X] T030 [P] [US2] Implement GET /api/sessions/:sessionId
- [X] T031 [P] [US2] Validate session ownership using userId
- [X] T032 [P] [US2] Implement PUT /api/sessions/:sessionId
- [X] T033 [US2] Update code field only
- [X] T034 [US2] Load code on editor mount
- [X] T035 [US2] Add "Save Code" button + handler

## Phase 5: User Story 3 – View Previous Sessions (P2)

**Acceptance Scenarios**:
- Dashboard shows only user's sessions
- Sorted by last updated
- Click opens editor with saved code

**Tasks**:
- [X] T040 [P] [US3] Implement GET /api/sessions
- [X] T041 [P] [US3] Filter sessions by userId
- [X] T042 [US3] Fetch sessions in Dashboard
- [X] T043 [US3] Render session list with metadata
- [X] T044 [US3] Navigate to editor on click

## Phase 6: Editor Integration Rules (CRITICAL)

- [X] T050 Enforce codeEditor.tsx as pure editor component, also make this component highly professional , you can use context 7 mcp server for reading docs for accurate and highly professional work 
- [X] T051 Create SessionEditorWrapper.tsx for API + state logic
- [X] T052 Ensure no API calls inside codeEditor.tsx
- [X] T053 Properly unmount Monaco editor on page exit

## Phase 7: Security, Validation & Polish

- [X] T060 Handle invalid session IDs (404)
- [X] T061 Prevent access to other users' sessions (403)
- [X] T062 Add loading & error states
- [X] T063 Limit code length (e.g., 10k chars)
- [X] T064 Ensure updatedAt auto-updates via Mongoose

## Dependencies

- Phase 0 MUST complete first
- Backend (Phases 1–3) before frontend editor
- US2 depends on US1
- US3 depends on US2

## Parallel Execution Opportunities

- T000.1-T000.4 can be executed in parallel (different review tasks)
- T020-T023 can be executed in parallel (backend API tasks)
- T030-T032 can be executed in parallel (backend API tasks)
- T040-T041 can be executed in parallel (backend API tasks)