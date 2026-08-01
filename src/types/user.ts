import type { User } from "./auth"

/** A team reference on a client user (id + name). */
export interface UserTeamRef {
  id: number
  name: string
}

/**
 * A member of the current workspace, as GET /api/users returns them.
 *
 * The person, plus the standing they have *here*: the same human appears in
 * another workspace's roster with a different role and different teams, and
 * neither list can see the other. Everyone on this list has accepted — people
 * who have only been invited are `WorkspaceInvitation`s, not members.
 */
export interface ClientUser
  extends Pick<
    User,
    | "id"
    | "first_name"
    | "last_name"
    | "display_name"
    | "email"
    | "has_avatar"
    | "created_at"
    | "updated_at"
  > {
  role: string
  teams: UserTeamRef[]
}

/**
 * Body for PATCH /api/users/{id} — an owner editing a client user. All fields
 * optional. `team_id` reassigns to a single team; `null` removes them from all
 * teams; omit it to leave team membership unchanged.
 */
export interface UserManageUpdate {
  first_name?: string
  last_name?: string
  role?: string
  team_id?: number | null
}

/**
 * Body for POST /api/users/new — inviting an address into this workspace.
 * No name: the invitee gives their own when they create their account.
 */
export interface UserManageCreate {
  email: string
  role: string
  team_id?: number | null
}
