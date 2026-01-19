GET http://localhost:5000/api/admin/users?page=1&limit=50 401 (Unauthorized)
GET http://localhost:5000/api/admin/sessions?page=1&limit=50 401 (Unauthorized)
api.ts:116  GET http://localhost:5000/api/admin/stats 401 (Unauthorized)
GET http://localhost:5000/api/admin/reports?page=1&limit=50 401 (Unauthorized)
AdminDashboard.tsx:91 Error fetching admin data: AdminDashboard.tsx:93 Error fetching admin data: Error: Failed to load users
    at fetchData (AdminDashboard.tsx:68:17)
    at fetchData (AdminDashboard.tsx:79:17)
Admin joined monitoring: Connected to admin monitoring