/**
 * A user's display name from their structured first/last name, falling back to
 * the legacy `full_name` while that column is being phased out (e.g. users
 * invited before their name was split).
 */
export function userDisplayName(user: {
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
}): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim()
  return name || user.full_name?.trim() || ""
}

/** Format an ISO date string as a readable local date-time. Returns "Not set" if empty. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "Not set"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
