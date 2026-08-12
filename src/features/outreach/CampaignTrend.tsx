import { useState } from "react"

import { cn } from "@/lib/utils"
import { SERIES } from "./campaignSeries"

/**
 * A campaign's day, four measures at a time: sent, opened, replied, and the
 * replies worth having.
 *
 * Grouped bars rather than stacked. The four are nested — every open was sent,
 * every reply was opened — so stacking them would add a number to itself three
 * times and draw a day of 360 sends as 587. Side by side, each bar is read
 * against the axis and against the day beside it, which is what "daily
 * performance" is asking.
 *
 * One y-axis, always. A second scale would let 14 positives be drawn as tall as
 * 360 sends and turn a funnel into a dead heat.
 *
 * The colours come from the app's fixed chart order (`--viz-1..4` in
 * `index.css`), validated for colour-blind separation against both surfaces.
 * Identity is never carried by colour alone: every series is named in the
 * legend and again in the figures below the plot.
 */

// A wide, shallow viewBox. The SVG scales to the card's width keeping its
// aspect, so the ratio *is* the rendered height — a squarer box was turning a
// trend line into a wall of chart.
const WIDTH = 960
const HEIGHT = 170
const PADDING = { top: 10, right: 14, bottom: 22, left: 38 }

// A day's bars sit together and its neighbours stand off: the gap between
// groups is what makes a group read as one day.
const GROUP_INSET = 0.22
// Surface showing between adjacent bars, so two dark hues never merge into one.
const BAR_GAP = 2
const CORNER = 3

/** A bar with rounded top corners, square on the baseline it stands on. */
function barPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(CORNER, width / 2, height)
  if (height <= 0) return ""
  return [
    `M${x},${y + height}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height}`,
    "Z",
  ].join(" ")
}

export interface TrendPoint {
  /** Short label for the x axis — a week ending, a day, whatever the series is. */
  label: string
  sent: number
  opens: number
  replies: number
  positive: number
}

export function CampaignTrend({ data }: { data: TrendPoint[] }) {
  // Which point the pointer is nearest, or null when it is not over the plot.
  const [active, setActive] = useState<number | null>(null)

  if (data.length === 0) return null

  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom
  // A shared ceiling across all three: the point of the chart is the gap
  // between them, which a per-series scale would flatten.
  const ceiling = Math.max(
    1,
    ...data.flatMap((point) => SERIES.map((series) => point[series.key])),
  )
  const niceCeiling = Math.ceil(ceiling / 10) * 10

  // Bars sit inside a band per day rather than on a point, so the first and
  // last day are not half off the edge of the plot.
  const band = plotWidth / data.length
  const groupWidth = band * (1 - GROUP_INSET)
  const barWidth = Math.max(
    1,
    (groupWidth - BAR_GAP * (SERIES.length - 1)) / SERIES.length,
  )
  const groupLeft = (index: number) =>
    PADDING.left + index * band + (band - groupWidth) / 2
  const x = (index: number) => groupLeft(index) + groupWidth / 2
  const y = (value: number) =>
    PADDING.top + plotHeight - (value / niceCeiling) * plotHeight
  const baseline = PADDING.top + plotHeight

  // Three lines, not five: at this height more grid than data is all it would
  // add.
  const gridValues = [0, 0.5, 1].map((f) => niceCeiling * f)
  // Enough room for every label at this width; more would collide.
  const labelEvery = Math.ceil(data.length / 6)

  return (
    <div>
      {/* A legend for every multi-series chart, so identity survives being
        * printed, screenshotted or read by someone who cannot separate the
        * hues. */}
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {SERIES.map((series) => (
          <span
            key={series.key}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ background: series.color }}
            />
            {series.label}
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label="Sent, opens, replies and positive replies per day"
          onMouseLeave={() => setActive(null)}
          onMouseMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect()
            // Pointer position in viewBox units, then the nearest point.
            const at =
              ((event.clientX - box.left) / box.width) * WIDTH - PADDING.left
            const index = Math.floor(at / band)
            setActive(Math.min(Math.max(index, 0), data.length - 1))
          }}
        >
          {/* Grid and axes stay recessive: they are the paper, not the data. */}
          {gridValues.map((value) => (
            <g key={value}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y(value)}
                y2={y(value)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={y(value) + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {value}
              </text>
            </g>
          ))}

          {data.map((point, index) =>
            index % labelEvery === 0 ? (
              <text
                key={point.label}
                x={x(index)}
                y={HEIGHT - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {point.label}
              </text>
            ) : null,
          )}

          {data.map((point, index) => (
            <g key={point.label}>
              {SERIES.map((series, slot) => {
                const value = point[series.key]
                const top = y(value)
                return (
                  <path
                    key={series.key}
                    d={barPath(
                      groupLeft(index) + slot * (barWidth + BAR_GAP),
                      top,
                      barWidth,
                      baseline - top,
                    )}
                    fill={series.color}
                    // The day under the pointer keeps its colour; the rest
                    // step back rather than the hovered one lighting up, so
                    // nothing changes hue on hover.
                    opacity={active === null || active === index ? 1 : 0.35}
                  />
                )
              })}
            </g>
          ))}
        </svg>

        {active !== null && (
          <div
            className={cn(
              "pointer-events-none absolute top-2 rounded-lg border bg-popover p-2 text-xs shadow-md",
              // Flip sides near the right edge so the tooltip never leaves the
              // card.
              active > data.length / 2 ? "left-2" : "right-2",
            )}
          >
            <p className="mb-1 font-medium">{data[active].label}</p>
            {SERIES.map((series) => (
              <p
                key={series.key}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ background: series.color }}
                />
                {series.label}
                <span className="ml-auto pl-3 font-medium text-foreground tabular-nums">
                  {data[active][series.key]}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
