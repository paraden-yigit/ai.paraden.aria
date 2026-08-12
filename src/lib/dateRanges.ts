/**
 * The date ranges a report is read over.
 *
 * Local dates throughout, and each range is a pair of `YYYY-MM-DD` strings —
 * the shape `<input type="date">` speaks and the shape an API filter wants.
 * Building these from a `Date` at the boundary would drag the browser's
 * timezone into the answer: `toISOString()` on midnight local in London in
 * August is the *previous* day, which is how "this month" quietly starts on the
 * 31st.
 *
 * Weeks start on Monday. Quarters are calendar quarters.
 */

export interface DateRange {
  from: string
  to: string
}

export const RANGE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "last_quarter", label: "Last quarter" },
  { value: "this_year", label: "This year" },
  { value: "last_year", label: "Last year" },
] as const

export type RangePreset = (typeof RANGE_PRESETS)[number]["value"]

/** `YYYY-MM-DD` for a local date, without going through UTC. */
export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/** Monday of the week `date` falls in. */
function startOfWeek(date: Date): Date {
  const start = new Date(date)
  // getDay() is 0 for Sunday, which is the *end* of the week here.
  const weekday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - weekday)
  return start
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/**
 * The dates a preset covers, relative to `today`.
 *
 * Ranges that include today end today rather than at the period's end: "this
 * month" is month-to-date, because a report cannot cover days that have not
 * happened.
 */
export function presetRange(preset: RangePreset, today = new Date()): DateRange {
  const year = today.getFullYear()
  const month = today.getMonth()
  const quarter = Math.floor(month / 3)

  switch (preset) {
    case "today":
      return { from: toIsoDate(today), to: toIsoDate(today) }
    case "yesterday": {
      const day = addDays(today, -1)
      return { from: toIsoDate(day), to: toIsoDate(day) }
    }
    case "this_week":
      return { from: toIsoDate(startOfWeek(today)), to: toIsoDate(today) }
    case "last_week": {
      const start = addDays(startOfWeek(today), -7)
      return { from: toIsoDate(start), to: toIsoDate(addDays(start, 6)) }
    }
    case "this_month":
      return { from: toIsoDate(new Date(year, month, 1)), to: toIsoDate(today) }
    case "last_month":
      return {
        from: toIsoDate(new Date(year, month - 1, 1)),
        // Day 0 of a month is the last day of the one before it.
        to: toIsoDate(new Date(year, month, 0)),
      }
    case "this_quarter":
      return {
        from: toIsoDate(new Date(year, quarter * 3, 1)),
        to: toIsoDate(today),
      }
    case "last_quarter":
      return {
        from: toIsoDate(new Date(year, quarter * 3 - 3, 1)),
        to: toIsoDate(new Date(year, quarter * 3, 0)),
      }
    case "this_year":
      return { from: toIsoDate(new Date(year, 0, 1)), to: toIsoDate(today) }
    case "last_year":
      return {
        from: toIsoDate(new Date(year - 1, 0, 1)),
        to: toIsoDate(new Date(year - 1, 11, 31)),
      }
  }
}

/** Which preset a range is, or null when it is one the user typed themselves. */
export function matchPreset(
  range: DateRange,
  today = new Date(),
): RangePreset | null {
  for (const preset of RANGE_PRESETS) {
    const candidate = presetRange(preset.value, today)
    if (candidate.from === range.from && candidate.to === range.to) {
      return preset.value
    }
  }
  return null
}
