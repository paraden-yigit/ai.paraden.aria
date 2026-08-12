/**
 * The headcount values the company-size slider can stop on, coarsening as they
 * climb.
 *
 * A linear 0–300,000 slider is unusable at the end that matters: one pixel is
 * hundreds of people, so "20 to 200" cannot be picked at all. These bands give
 * single-employee precision at the bottom and 10,000-employee jumps at the top,
 * which is the resolution each end is actually chosen at.
 */
const BANDS = [
  { until: 10, step: 1 },
  { until: 50, step: 5 },
  { until: 100, step: 10 },
  { until: 500, step: 25 },
  { until: 1_000, step: 50 },
  { until: 5_000, step: 250 },
  { until: 10_000, step: 500 },
  { until: 50_000, step: 2_500 },
  { until: 100_000, step: 5_000 },
  { until: 300_000, step: 10_000 },
]

function buildStops(): number[] {
  const stops = [0]
  let current = 0
  for (const band of BANDS) {
    while (current < band.until) {
      current += band.step
      stops.push(current)
    }
  }
  return stops
}

export const HEADCOUNT_STOPS = buildStops()
export const HEADCOUNT_MIN = HEADCOUNT_STOPS[0]
export const HEADCOUNT_MAX = HEADCOUNT_STOPS[HEADCOUNT_STOPS.length - 1]

/** The stop nearest a headcount, so a value from elsewhere still lands on the
 * scale rather than snapping to an end. */
export function toStopIndex(value: number): number {
  let best = 0
  for (let i = 1; i < HEADCOUNT_STOPS.length; i++) {
    if (
      Math.abs(HEADCOUNT_STOPS[i] - value) <
      Math.abs(HEADCOUNT_STOPS[best] - value)
    ) {
      best = i
    }
  }
  return best
}

/** A headcount short enough to label the scale with: `300k+` rather than
 * `300,000+`, which is too wide to sit under a tick. The top of the scale is a
 * floor, not a ceiling — nothing above it exists. */
export function formatHeadcountShort(value: number): string {
  const short =
    value >= 1_000 ? `${Math.round(value / 1_000)}k` : String(value)
  return value >= HEADCOUNT_MAX ? `${short}+` : short
}
