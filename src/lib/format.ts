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
