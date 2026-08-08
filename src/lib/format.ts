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

/**
 * A snake_case identifier as a person would read it: `one_word_reply` becomes
 * "One word reply".
 *
 * Sentence case, not title case — these are phrases ("Permission to send"), and
 * capitalising every word would make them read like product names.
 */
export function formatSlug(slug: string): string {
  const words = slug.replace(/[_-]+/g, " ").trim()
  return words ? words[0].toUpperCase() + words.slice(1) : words
}
