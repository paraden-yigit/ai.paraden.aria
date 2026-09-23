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

/** A date on its own, no time: "9 Aug 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Not set"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * A `YYYY-MM-DD` day as a local `Date`, or null when it is not one.
 *
 * Never `new Date(iso)`: that is midnight **UTC**, which anywhere west of
 * Greenwich is the day before. A day is a day, not an instant, so it is rebuilt
 * as local midnight — which is also what makes its weekday and its date safe to
 * read.
 */
export function parseDay(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

/** A `YYYY-MM-DD` day as a person would read it: "9 Aug 2026". */
export function formatDay(iso: string | null | undefined): string {
  const date = parseDay(iso)
  if (!date) return iso || "Not set"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * The same day, short: "9 Aug".
 *
 * For axes and labels, where the year is either obvious from the period or not
 * worth the width.
 */
export function formatDayShort(iso: string | null | undefined): string {
  const date = parseDay(iso)
  if (!date) return iso || "Not set"
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

// Each unit, and how many of it make one of the unit after it.
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.348],
  ["month", 12],
  ["year", Infinity],
]

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

/**
 * How long ago, in the largest unit that still says something: "3 minutes ago",
 * "yesterday", "3 weeks ago".
 *
 * For a column nobody reads for precision — "was this today or last month" is
 * the question, and an exact timestamp answers it more slowly. Pair it with the
 * real date on hover, which is what `formatDate` is for.
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Not set"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const seconds = (date.getTime() - Date.now()) / 1000
  // Below a minute there is no unit worth naming, and "0 minutes ago" is worse
  // than saying so.
  if (Math.abs(seconds) < 60) return "just now"

  let value = seconds / 60
  for (const [unit, perNext] of RELATIVE_UNITS) {
    if (Math.abs(value) < perNext) return RELATIVE.format(Math.round(value), unit)
    value /= perNext
  }
  return RELATIVE.format(Math.round(value), "year")
}

/**
 * How long something has been going, in the largest unit that still says
 * something: "6 hours", "3 days", "2 weeks".
 *
 * A duration rather than a point in time — "running for 3 days" is the question
 * a campaign's status answers, not "started on the 6th".
 */
export function formatDuration(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const minutes = Math.max(0, (Date.now() - date.getTime()) / 60000)
  if (minutes < 60) {
    const value = Math.max(1, Math.round(minutes))
    return `${value} minute${value === 1 ? "" : "s"}`
  }
  const scale: [string, number][] = [
    ["hour", 24],
    ["day", 7],
    ["week", 4.348],
    ["month", 12],
  ]
  let value = minutes / 60
  for (const [unit, perNext] of scale) {
    if (value < perNext) {
      const rounded = Math.round(value)
      return `${rounded} ${unit}${rounded === 1 ? "" : "s"}`
    }
    value /= perNext
  }
  const years = Math.round(value)
  return `${years} year${years === 1 ? "" : "s"}`
}

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
 * Between a hundred and a thousand the figure is rounded *up* to the nearest
 * ten (135 → "140", 487 → "490"). No tilde: the panel around this number says
 * "Estimated Pool Size", so every figure in it is already understood to be an
 * estimate, and a squiggle in front of one of them only makes the reader wonder
 * what is different about that one.
 *
 * Under a hundred it is shown exactly. A pool that small is not a shape to be
 * read, it is a list somebody is about to look at one prospect at a time — and
 * the difference between 38 and 40 decides whether the campaign is worth
 * launching at all. Rounding 38 up would overstate the one number nobody can
 * afford to have overstated.
 */
export function formatPoolSize(total: number): string {
  // Divide as integers and only then place the point: `Math.floor(2900 / 1000 *
  // 10)` is 28 in floating point, which would print 2,900 as "2.8K".
  const tenths = (value: number) =>
    Number.isInteger(value / 10) ? String(value / 10) : (value / 10).toFixed(1)

  if (total >= 1_000_000) return `${tenths(Math.floor(total / 100_000))}M`
  if (total >= 1_000) return `${tenths(Math.floor(total / 100))}K`
  if (total < 100) return POOL_NUMBER.format(Math.max(total, 0))
  return POOL_NUMBER.format(Math.ceil(total / 10) * 10)
}
