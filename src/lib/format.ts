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
const POOL_NUMBER = new Intl.NumberFormat("en-GB")

export function formatSlug(slug: string): string {
  const words = slug.replace(/[_-]+/g, " ").trim()
  return words ? words[0].toUpperCase() + words.slice(1) : words
}

/**
 * The pool size, rounded to how precisely it is worth reading.
 *
 * A provider total is an estimate that moves between one search and the next, so
 * showing all six digits claims a precision nobody has — one decimal is as far
 * as it is worth reading (3,800 → "3.8K", 885,421 → "885.4K", 1,437,000 →
 * "1.4M"), and thousands are rounded *down* so a large pool never reads bigger
 * than it is.
 *
 * Below a thousand the figure is rounded *up* to the nearest fifty and marked
 * with a tilde (135 → "~150", 487 → "~500"). The tilde is the point: down there
 * the exact number invites arithmetic it cannot support, and a rough shape read
 * as "about 150" is the honest version. Zero is left exact — "about fifty" when
 * there is nobody would be a lie rather than a rounding.
 */
export function formatPoolSize(total: number): string {
  // Divide as integers and only then place the point: `Math.floor(2900 / 1000 *
  // 10)` is 28 in floating point, which would print 2,900 as "2.8K".
  const tenths = (value: number) =>
    Number.isInteger(value / 10) ? String(value / 10) : (value / 10).toFixed(1)

  if (total >= 1_000_000) return `${tenths(Math.floor(total / 100_000))}M`
  if (total >= 1_000) return `${tenths(Math.floor(total / 100))}K`
  if (total <= 0) return "0"
  return `~${POOL_NUMBER.format(Math.ceil(total / 50) * 50)}`
}
