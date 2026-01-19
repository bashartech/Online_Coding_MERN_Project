=== AUTHENTICATION SUCCESSFUL ===
Authenticated User ID: user_38JGkR4rgCRvLcYHrXl3XpbbdzN
Session ID: sess_38SzpExhOyPeblZETfHxU7NUviI
Successfully fetched user user_38JGkR4rgCRvLcYHrXl3XpbbdzN from Clerk API 
{
  userDataKeys: [
    'id',
    'passwordEnabled',
    'totpEnabled',
    'backupCodeEnabled',
    'twoFactorEnabled',
    'banned',
    'locked',
    'createdAt',
    'updatedAt',
    'imageUrl',
    'hasImage',
    'primaryEmailAddressId',
    'primaryPhoneNumberId',
    'primaryWeb3WalletId',
    'lastSignInAt',
    'externalId',
    'username',
    'firstName',
    'lastName',
    'publicMetadata',
    'privateMetadata',
    'unsafeMetadata',
    'emailAddresses',
    'phoneNumbers',
    'web3Wallets',
    'externalAccounts',
    'samlAccounts',
    'lastActiveAt',
    'createOrganizationEnabled',
    'createOrganizationsLimit',
    'deleteSelfEnabled',
    'legalAcceptedAt',
    'locale',
    '_raw'
  ],
  email_addresses: undefined,
  primary_email_address: undefined,
  email_address: undefined,
  first_name: undefined,
  last_name: undefined,
  username: null,
  profile_image_url: undefined,
  image_url: undefined
}
Using Clerk API data for user user_38JGkR4rgCRvLcYHrXl3XpbbdzN: {
  email: '',
  firstName: '',
  lastName: '',
  username: 'user_38JGkR4rgCRvLcYHrXl3XpbbdzN',
  clerkId: 'user_38JGkR4rgCRvLcYHrXl3XpbbdzN'
}
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
  'accept-encoding',    'accept-language',
  'if-none-match'
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
  'actor',
  'sessionClaims',
  'sessionId',
  'sessionStatus',
  'userId',
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
User ID: user_38JGkR4rgCRvLcYHrXl3XpbbdzN
Is Authenticated: true
Session Status: active
Session ID: sess_38SzpExhOyPeblZETfHxU7NUviI
Token Type: session_token
Has Claims: true
Session Claims Keys: [
  'azp', 'exp', 'fva',
  'iat', 'iss', 'nbf',
  'sid', 'sts', 'sub',
  'v'
]
Session Claims Sub (User ID): user_38JGkR4rgCRvLcYHrXl3XpbbdzN
Session Claims SID (Session ID): sess_38SzpExhOyPeblZETfHxU7NUviI
Session Claims Org ID: undefined