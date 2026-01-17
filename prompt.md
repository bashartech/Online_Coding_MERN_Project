# in console

Session details in fetch: {status: 'active', id: 'sess_38NIG8e226V2jPh33DNsn7cZTVp', userId: 'user_38JGkR4rgCRvLcYHrXl3XpbbdzN', lastActiveAt: Sat Jan 17 2026 12:05:03 GMT+0500 (Pakistan Standard Time)}
Dashboard.tsx:84 Session details in fetch: {status: 'active', id: 'sess_38NIG8e226V2jPh33DNsn7cZTVp', userId: 'user_38JGkR4rgCRvLcYHrXl3XpbbdzN', lastActiveAt: Sat Jan 17 2026 12:05:03 GMT+0500 (Pakistan Standard Time)}

api.ts:7  GET http://localhost:5000/api/sessions 401 (Unauthorized)
RESPONSE---> Response {type: 'cors', url: 'http://localhost:5000/api/sessions', redirected: false, status: 401, ok: false, …}
Session details in fetch: {status: 'active', id: 'sess_38NIG8e226V2jPh33DNsn7cZTVp', userId: 'user_38JGkR4rgCRvLcYHrXl3XpbbdzN', lastActiveAt: Sat Jan 17 2026 12:06:51 GMT+0500 (Pakistan Standard Time)}
Dashboard.tsx:94 Generated token in fetch: Token present

# in backend 

=== AUTH MIDDLEWARE DEBUG ===
Full Request URL: /api/sessions
Base Request URL: /
Method: GET
Headers: [
  'host',               'connection',
  'sec-ch-ua-platform', 'authorization',
  'user-agent',         'sec-ch-ua',
  'content-type',       'sec-ch-ua-mobile',
  'accept',             'origin',
  'sec-fetch-site',     'sec-fetch-mode',
  'sec-fetch-dest',     'referer',
  'accept-encoding',    'accept-language'
]
Authorization Header Present: true
Token Length: 800
Token Start: eyJhbGciOiJSUzI1NiIsImNhdCI6Im...
JWT Header: {
  alg: 'RS256',
  cat: 'cl_B7d4PD111AAA',
  kid: 'ins_38JCFQSs3A36p1U30itJt6Ti7lg',
  typ: 'JWT'
}
Is this the intended route? false
Environment Keys Loaded: {
  hasSecretKey: true,
  hasPublishableKey: true,
  secretKeyLength: 50,
  publishableKeyLength: 56
}
=== CLERK AUTH RESOLVED ===
Full Auth Object Keys: [
  'tokenType',
  'sessionClaims',
  'sessionId',
  'sessionStatus',
  'userId',
  'actor',
  'orgId',
  'orgRole',
  'orgSlug',
  'orgPermissions',
  'factorVerificationAge',
  'getToken',
  'has',
  'debug',
  'isAuthenticated'
]
Auth Object Type: object
User ID: null
Is Authenticated: false
Session Status: null
Session ID: null
Token Type: session_token
Has Claims: false
=== AUTHENTICATION FAILED ===
Failure Details:
- isAuthenticated: false
- userId: null
- sessionId: null
- sessionStatus: null
=== AUTH MIDDLEWARE DEBUG ===
Full Request URL: /api/sessions
Base Request URL: /
Method: GET
Headers: [
  'host',               'connection',
  'sec-ch-ua-platform', 'authorization',
  'user-agent',         'sec-ch-ua',
  'content-type',       'sec-ch-ua-mobile',
  'accept',             'origin',
  'sec-fetch-site',     'sec-fetch-mode',
  'sec-fetch-dest',     'referer',
  'accept-encoding',    'accept-language'
]
Authorization Header Present: true
Token Length: 800
Token Start: eyJhbGciOiJSUzI1NiIsImNhdCI6Im...
JWT Header: {
  alg: 'RS256',
  cat: 'cl_B7d4PD111AAA',
  kid: 'ins_38JCFQSs3A36p1U30itJt6Ti7lg',
  typ: 'JWT'
}
Is this the intended route? false
Environment Keys Loaded: {
  hasSecretKey: true,
  hasPublishableKey: true,
  secretKeyLength: 50,
  publishableKeyLength: 56
}
=== CLERK AUTH RESOLVED ===
Full Auth Object Keys: [
  'tokenType',
  'sessionClaims',
  'sessionId',
  'sessionStatus',
  'userId',
  'actor',
  'orgId',
  'orgRole',
  'orgSlug',
  'orgPermissions',
  'factorVerificationAge',
  'getToken',
  'has',
  'debug',
  'isAuthenticated'
]
Auth Object Type: object
User ID: null
Is Authenticated: false
Session Status: null
Session ID: null
Token Type: session_token
Has Claims: false
=== AUTHENTICATION FAILED ===
Failure Details:
- isAuthenticated: false
- userId: null
- sessionId: null
- sessionStatus: null