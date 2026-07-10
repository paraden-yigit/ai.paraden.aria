/** Authorization roles within a client, mirroring the API's UserRole. */
export const USER_ROLES = ["owner", "team_leader", "user"] as const

export type UserRole = (typeof USER_ROLES)[number]

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  team_leader: "Team Leader",
  user: "User",
}

/** Human-readable label for a role value (falls back to the raw value). */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Invited",
  inactive: "Inactive",
}

/** Human-readable label for a user status (falls back to the raw value). */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}
