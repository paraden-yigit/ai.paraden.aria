/**
 * Authenticated end-user profile, as returned by GET /api/auth/me
 * (the API's UserRead shape). The dashboard never sees the password.
 */
export interface User {
  id: number
  client_id: number
  // The name, in parts — null until the user accepts their invitation and types
  // it on the set-password page. Editable afterwards in profile settings.
  first_name: string | null
  last_name: string | null
  // The parts joined, or the email address while an invitation is still pending.
  // Derived by the API and never empty, so it can be rendered without a guard.
  display_name: string
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

/**
 * What GET /api/auth/password-reset/{token} returns for a link that is still
 * good — just the address, so the form can say whose password is being set.
 */
export interface PasswordResetInfo {
  email: string
}

/** Body for PATCH /api/auth/me — the current user's self-serve profile edit. */
export interface UserProfileUpdate {
  first_name?: string | null
  last_name?: string | null
  forwarding_email?: string | null
  email_tone?: string | null
  email_signature?: string | null
}
