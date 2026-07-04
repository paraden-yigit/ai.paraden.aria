/**
 * Authenticated end-user profile, as returned by GET /api/auth/me
 * (the API's UserRead shape). The dashboard never sees the password.
 */
export interface User {
  id: number
  client_id: number
  full_name: string
  email: string
  status: string
  role: string
  created_at: string
  updated_at: string
}
