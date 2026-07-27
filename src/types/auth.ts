/**
 * Authenticated end-user profile, as returned by GET /api/auth/me
 * (the API's UserRead shape). The dashboard never sees the password.
 */
export interface User {
  id: number
  client_id: number
  full_name: string
  // Optional structured name, edited in the email-settings profile section.
  // Independent of full_name (the display name shown across the app).
  first_name: string | null
  last_name: string | null
  email: string
  // Where replies/notifications are forwarded; distinct from the login email.
  forwarding_email: string | null
  status: string
  role: string
  // Permission keys the user's role grants; used to show/hide gated pages.
  permissions: string[]
  // Whether the client's first-login onboarding wizard has been completed. Drives
  // the onboarding route guard (owner runs the wizard; others wait).
  client_onboarding_completed: boolean
  // Set only while a user is pending (invited, no password yet); used to build
  // the invitation link. Cleared once they accept.
  invitation_token?: string | null
  // Per-user email voice (moved here from company info) + HTML signature
  // appended to every generated email. Edited on the User Profile page.
  email_tone: string | null
  email_signature: string | null
  // Whether a profile picture is stored; the bytes are streamed separately from
  // GET /api/auth/me/avatar (see authService.avatarObjectUrl).
  has_avatar: boolean
  created_at: string
  updated_at: string
}

/** Body for PATCH /api/auth/me — the current user's self-serve profile edit. */
export interface UserProfileUpdate {
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  forwarding_email?: string | null
  email_tone?: string | null
  email_signature?: string | null
}
