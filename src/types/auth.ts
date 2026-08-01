/**
 * Authenticated end-user profile, as returned by GET /api/auth/me
 * (the API's UserRead shape). The dashboard never sees the password.
 */
/** A team a member sits on within one workspace. */
export interface WorkspaceTeamRef {
  id: number
  name: string
}

/** One workspace the user belongs to, as the picker and switcher list it. */
export interface Workspace {
  client_id: number
  name: string
  /** The role held *here* — the same person may hold another one elsewhere. */
  role: string
  team: WorkspaceTeamRef | null
  onboarding_completed: boolean
}

/**
 * The workspace the session is currently working in, with everything needed to
 * render inside it. `permissions` are the keys this workspace's role grants, so
 * a page can appear in one workspace and not another for the same person.
 */
export interface ActiveWorkspace extends Workspace {
  permissions: string[]
  email_tone: string | null
  email_signature: string | null
  forwarding_email: string | null
}

/** A workspace asking this person to join it. */
export interface PendingInvitation {
  token: string
  client_id: number
  workspace_name: string
  role: string
  expires_at: string
}

export interface User {
  id: number
  // The name, in parts — null until they finish creating their account.
  first_name: string | null
  last_name: string | null
  // The parts joined, falling back to the email address. Derived by the API and
  // never empty, so it can be rendered without a guard.
  display_name: string
  email: string
  // Whether a profile picture is stored; the bytes are streamed separately from
  // GET /api/auth/me/avatar (see authService.avatarObjectUrl).
  has_avatar: boolean
  created_at: string
  updated_at: string

  /**
   * The workspace this session is in, or null when it hasn't got one: the user
   * belongs to several and hasn't chosen, or belongs to none at all. Everything
   * that used to sit flat on the user — role, permissions, onboarding state —
   * lives here now, because all of it depends on where they are working.
   */
  active_workspace: ActiveWorkspace | null
  workspaces: Workspace[]
  pending_invitations: PendingInvitation[]
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
