# Quickstart Guide: Code Editor & Session Management

## Prerequisites

- Node.js 16+ installed
- MongoDB instance running (local or cloud)
- Clerk account configured with secret key
- Existing project dependencies installed

## Environment Setup

1. **Configure environment variables** in your `.env` file:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

## API Endpoints

### Session Management

#### Create a New Session
```bash
POST /api/sessions
Authorization: Bearer {clerk_token}

# Optional request body:
{
  "title": "My New Session",
  "language": "javascript"
}
```

Response:
```json
{
  "sessionId": "sess_unique_id",
  "success": true
}
```

#### Get All User Sessions
```bash
GET /api/sessions
Authorization: Bearer {clerk_token}
```

Response:
```json
[
  {
    "sessionId": "sess_abc123",
    "title": "JavaScript Practice",
    "updatedAt": "2023-10-20T10:30:00Z",
    "language": "javascript"
  }
]
```

#### Get Specific Session
```bash
GET /api/sessions/{sessionId}
Authorization: Bearer {clerk_token}
```

Response:
```json
{
  "sessionId": "sess_abc123",
  "title": "JavaScript Practice",
  "code": "console.log('Hello World');",
  "language": "javascript",
  "createdAt": "2023-10-20T09:00:00Z",
  "updatedAt": "2023-10-20T10:30:00Z"
}
```

#### Update Session Code
```bash
PUT /api/sessions/{sessionId}
Authorization: Bearer {clerk_token}

{
  "code": "console.log('Updated code');",
  "language": "javascript"
}
```

Response:
```json
{
  "success": true
}
```

## Frontend Integration

### Using the Code Editor Component

The existing `codeEditor.tsx` component can be wrapped for session management:

```tsx
import CodeEditor from '@/components/codeEditor';
import { useState, useEffect } from 'react';

interface SessionEditorProps {
  sessionId: string;
}

const SessionEditor: React.FC<SessionEditorProps> = ({ sessionId }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);

  // Load session data on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (response.ok) {
          const sessionData = await response.json();
          setCode(sessionData.code);
          setLanguage(sessionData.language);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  // Save code to session
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      if (response.ok) {
        alert('Session saved successfully!');
      } else {
        alert('Failed to save session');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Error saving session');
    }
  };

  if (loading) return <div>Loading editor...</div>;

  return (
    <div>
      <CodeEditor /* Pass appropriate props */ />
      <button onClick={handleSave}>Save Code</button>
    </div>
  );
};

export default SessionEditor;
```

## Database Models

The Session model extends the existing schema with code content:

```javascript
// Extended fields in addition to existing Session.js
{
  codeContent: String,  // The actual code content (max 10,000 chars)
  // Other existing fields...
}
```

## Authentication

All API endpoints use Clerk middleware for authentication. The system verifies:
1. User is authenticated via Clerk token
2. Session belongs to the authenticated user (via ownerId check)
3. Appropriate permissions for requested operations

## Error Handling

Common error responses:
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks permission for the resource
- `404 Not Found`: Resource does not exist
- `400 Bad Request`: Invalid input parameters
- `500 Internal Server Error`: Unexpected server error

## Testing

1. **Unit tests**: Test individual API endpoints with mock data
2. **Integration tests**: Verify full session lifecycle (create, read, update, delete)
3. **Authentication tests**: Ensure proper access controls

Example test for creating a session:
```javascript
// Using Jest and Supertest
it('should create a new session for authenticated user', async () => {
  const response = await request(app)
    .post('/api/sessions')
    .set('Authorization', 'Bearer valid_clerk_token')
    .expect(201);

  expect(response.body).toHaveProperty('sessionId');
  expect(response.body.success).toBe(true);
});
```