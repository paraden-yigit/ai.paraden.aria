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
  // Per-user email voice (moved here from company info) + HTML signature
  // appended to every generated email. Edited on the User Profile page.
  email_tone: string | null
  email_signature: string | null
  created_at: string
  updated_at: string
}

/** Body for PATCH /api/auth/me — the current user's self-serve profile edit. */
export interface UserProfileUpdate {
  full_name?: string | null
  email_tone?: string | null
  email_signature?: string | null
}
