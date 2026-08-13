import { useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDayShort, parseDay } from "@/lib/format"
import type { ProspectsFound, ProspectsFoundDay } from "@/types/outreach"

// Chart palette, validated for both surfaces (dataviz six-checks): green and
// sky steps from the brand hues, snapped into the passing lightness bands.
const SERIES_VARS =
  "[--series-1:#0e8c72] [--series-2:#2493cc] dark:[--series-1:#23a873] dark:[--series-2:#3c9dcb]"

// Fixed coordinate space for the line chart; the SVG scales responsively.
const W = 480
const H = 160
const PLOT_LEFT = 10
const PLOT_RIGHT = 446
const BASELINE = 128
const PLOT_TOP = 16

/** A week of the month, and the people the campaigns gained in it. */
interface Week {
  /** `YYYY-MM-DD` of the first and last day counted, both inclusive. */
  start: string
  end: string
  count: number
}

/**
 * The month's days gathered into weeks.
 *
 * Weeks start on Monday, as everywhere else in the app, and the first one is
 * short whenever the month does not: this is the month cut into weeks, not the
 * last N weeks, so a bucket never reaches back past the 1st.
 */
function toWeeks(days: ProspectsFoundDay[]): Week[] {
  const weeks: Week[] = []
  for (const point of days) {
    const current = weeks[weeks.length - 1]
    if (!current || parseDay(point.day)?.getDay() === 1) {
      weeks.push({ start: point.day, end: point.day, count: point.count })
    } else {
      current.end = point.day
      current.count += point.count
    }
  }
  return weeks
}

/** "3–9 Aug", or "9 Aug" for a week only one day long so far. */
function weekLabel(week: Week): string {
  const end = formatDayShort(week.end)
  if (week.start === week.end) return end
  return `${parseDay(week.start)?.getDate() ?? ""}–${end}`
}

function TrendChart({ weeks }: { weeks: Week[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const last = weeks.length - 1
  // A round ceiling above the busiest week, so the line sits inside the plot
  // and the scale reads in whole steps.
  const peak = Math.max(1, ...weeks.map((week) => week.count))
  const ceiling = Math.ceil(peak / 5) * 5 || 5

  const x = (i: number) =>
    weeks.length === 1
      ? (PLOT_LEFT + PLOT_RIGHT) / 2
      : PLOT_LEFT + (i * (PLOT_RIGHT - PLOT_LEFT)) / (weeks.length - 1)
  const y = (v: number) => BASELINE - (v / ceiling) * (BASELINE - PLOT_TOP)

  const linePath = weeks
    .map((week, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(week.count)}`)
    .join(" ")
  const areaPath = `${linePath} L${x(last)},${BASELINE} L${x(0)},${BASELINE} Z`

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Prospects found each week this month: ${weeks
          .map((week) => `${weekLabel(week)}, ${week.count}`)
          .join("; ")}`}
      >
        {/* Recessive frame: one faint mid reference plus the baseline. */}
        <line
          x1={PLOT_LEFT}
          y1={y(ceiling / 2)}
          x2={PLOT_RIGHT}
          y2={y(ceiling / 2)}
          className="stroke-border"
          strokeDasharray="2 4"
        />
        <line
          x1={PLOT_LEFT}
          y1={BASELINE}
          x2={PLOT_RIGHT}
          y2={BASELINE}
          className="stroke-border"
        />
        {/* One week in is a point, not a trend: drawing a line and its area
          * through a single value would invent a shape nobody has earned. */}
        {weeks.length > 1 && (
          <>
            <path d={areaPath} fill="var(--series-1)" opacity="0.12" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--series-1)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}
        {weeks.map((week, i) => (
          <g key={week.start}>
            {(hover === i || i === last) && (
              <circle cx={x(i)} cy={y(week.count)} r="3.5" fill="var(--series-1)" />
            )}
            {/* Oversized invisible hover target (≥8px radius). */}
            <circle
              cx={x(i)}
              cy={y(week.count)}
              r="14"
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
        {/* Direct label on the latest week only. */}
        <text
          x={x(last) + 8}
          y={y(weeks[last]!.count) + 4}
          className="fill-foreground"
          fontSize="12"
          fontWeight="600"
        >
          {weeks[last]!.count}
        </text>
        <text x={PLOT_LEFT} y={H - 12} className="fill-muted-foreground" fontSize="10">
          {weekLabel(weeks[0]!)}
        </text>
        <text
          x={PLOT_RIGHT}
          y={H - 12}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize="10"
        >
          This week
        </text>
      </svg>
      {hover != null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            top: `${((y(weeks[hover]!.count) - 8) / H) * 100}%`,
          }}
        >
          <span className="font-medium">{weeks[hover]!.count}</span>{" "}
          <span className="text-muted-foreground">
            prospects, {weekLabel(weeks[hover]!)}
          </span>
        </div>
      )}
    </div>
  )
}

/** The month's prospects by the campaign they landed in, biggest first. */
function CampaignsChart({
  campaigns,
}: {
  campaigns: ProspectsFound["campaigns"]
}) {
  const max = Math.max(...campaigns.map((c) => c.count))
  return (
    <div className="space-y-4 pt-1">
      {campaigns.map((campaign) => (
        <div key={campaign.run_id}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
            <Link
              to={`/campaigns/${campaign.run_id}`}
              className="truncate font-medium hover:underline"
            >
              {campaign.name}
            </Link>
            <span className="shrink-0 text-muted-foreground">
              {campaign.count} people
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-r-[4px] bg-muted">
            <div
              className="h-full rounded-r-[4px]"
              style={{
                width: `${(campaign.count / max) * 100}%`,
                backgroundColor: "var(--series-2)",
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Everyone added to a campaign's list this month, whether Paraden found
        them or you uploaded them.
      </p>
    </div>
  )
}

/** The card shell both charts sit in, so the two stay the same shape. */
function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <Badge variant="secondary">Month to date</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/**
 * The month so far, twice: how the pipeline filled week by week, and which
 * campaigns it filled.
 *
 * Both read the same request, so the two can never disagree about how many
 * people the month has produced. Month to date rather than a rolling window —
 * "how are we doing this month" is the question a dashboard is asked, and it
 * is the same period the campaign pages default to.
 */
export function ProspectCharts({
  data,
  loading,
}: {
  data: ProspectsFound | null
  loading: boolean
}) {
  const weeks = data ? toWeeks(data.days) : []
  const empty = !data || data.total === 0

  return (
    <div className={`grid gap-6 md:grid-cols-2 ${SERIES_VARS}`}>
      <ChartCard
        title="Prospects found per week"
        description="How your pipeline has filled this month."
      >
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : empty || weeks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No prospects yet this month. A running campaign adds to its list as
            it finds people.
          </p>
        ) : (
          <TrendChart weeks={weeks} />
        )}
      </ChartCard>

      <ChartCard
        title="Which campaigns they went to"
        description="This month's prospects, by campaign."
      >
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : empty ? (
          <p className="text-sm text-muted-foreground">
            Nothing to split up yet — no campaign has gained anybody this month.
          </p>
        ) : (
          <CampaignsChart campaigns={data.campaigns} />
        )}
      </ChartCard>
    </div>
  )
}
