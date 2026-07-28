import type { User } from "./auth"

/** A team reference on a client user (id + name). */
export interface UserTeamRef {
  id: number
  name: string
}

/** A client user as returned by GET /api/users — the roster, with their teams. */
export interface ClientUser extends User {
  teams: UserTeamRef[]
  /**
   * Only on the response of POST /api/users/new: whether the invitation email
   * actually went out. `false` (or absent) means the link has to be shared by
   * hand.
   */
  invitation_email_sent?: boolean
}

/**
 * Body for PATCH /api/users/{id} — an owner editing a client user. All fields
 * optional. `team_id` reassigns to a single team; `null` removes them from all
 * teams; omit it to leave team membership unchanged.
 */
export interface UserManageUpdate {
  full_name?: string
  role?: string
  team_id?: number | null
}

/** Body for POST /api/users/new — an owner inviting a new user to the client. */
export interface UserManageCreate {
  full_name: string
  email: string
  role: string
  team_id?: number | null
}
