/**
 * The four measures a campaign is read by, in a fixed order.
 *
 * The order is the point, and it is the funnel's: sent, then opened, then
 * replied, then the replies worth having. Slot 1 is always Sent whichever chart
 * or card is drawing them. Colour follows the
 * measure, never its rank, so a filtered or reordered view cannot repaint the
 * survivors. The hues themselves are `--viz-1..3` in `index.css`, validated for
 * colour-blind separation against both surfaces.
 */
export const SERIES = [
  { key: "sent", label: "Sent", color: "var(--viz-1)" },
  { key: "opens", label: "Opens", color: "var(--viz-2)" },
  { key: "replies", label: "Replies", color: "var(--viz-3)" },
  { key: "positive", label: "Positive", color: "var(--viz-4)" },
] as const

export type SeriesKey = (typeof SERIES)[number]["key"]
