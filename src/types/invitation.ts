/** The five states a reader cares about (the API derives "expired"). */
export type InvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "revoked"
  | "expired"

/**
 * What the invitation page knows before anyone signs in.
 *
 * `account_exists` is the branch the page turns on: sign in, or create an
 * account first.
 */
export interface Invitation {
  email: string
  workspace_name: string
  role: string
  team_name: string | null
  invited_by_name: string | null
  expires_at: string
  status: InvitationStatus
  account_exists: boolean
}

/** Body for creating the account an invitation is addressed to. */
export interface InvitationRegister {
  first_name: string
  last_name: string
  password: string
}

/** An invitation as the workspace that sent it sees it. */
export interface WorkspaceInvitation {
  id: number
  email: string
  role: string
  expires_at: string
  responded_at: string | null
  created_at: string
  /** Carried so the link can be copied when the email doesn't arrive. */
  token: string
  status: InvitationStatus
  /** Only on a create/resend response: whether the email actually went out. */
  invitation_email_sent?: boolean
}
