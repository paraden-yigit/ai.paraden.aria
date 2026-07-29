import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// SAMPLE DATA (design preview): these series are placeholders so the dashboard
// shows its intended shape. Replace with live figures once the API exposes
// discovery/outreach history; flagged in the PR for wiring.
const WEEKLY_PROSPECTS = [12, 19, 9, 26, 31, 22, 38, 44]
const SOURCES = [
  { label: "Found by Paraden", value: 97, colorVar: "var(--series-1)" },
  { label: "Uploaded by you", value: 61, colorVar: "var(--series-2)" },
]

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
const Y_MAX = 48

function x(i: number): number {
  return PLOT_LEFT + (i * (PLOT_RIGHT - PLOT_LEFT)) / (WEEKLY_PROSPECTS.length - 1)
}

function y(v: number): number {
  return BASELINE - (v / Y_MAX) * (BASELINE - PLOT_TOP)
}

function TrendChart() {
  const [hover, setHover] = useState<number | null>(null)
  const linePath = WEEKLY_PROSPECTS.map(
    (v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`,
  ).join(" ")
  const areaPath = `${linePath} L${PLOT_RIGHT},${BASELINE} L${PLOT_LEFT},${BASELINE} Z`
  const last = WEEKLY_PROSPECTS.length - 1

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Prospects found per week over the last 8 weeks, sample data, most recent week ${WEEKLY_PROSPECTS[last]}`}
      >
        {/* Recessive frame: one faint mid reference plus the baseline. */}
        <line
          x1={PLOT_LEFT}
          y1={y(Y_MAX / 2)}
          x2={PLOT_RIGHT}
          y2={y(Y_MAX / 2)}
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
        <path d={areaPath} fill="var(--series-1)" opacity="0.12" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {WEEKLY_PROSPECTS.map((v, i) => (
          <g key={i}>
            {(hover === i || i === last) && (
              <circle cx={x(i)} cy={y(v)} r="3.5" fill="var(--series-1)" />
            )}
            {/* Oversized invisible hover target (≥8px radius). */}
            <circle
              cx={x(i)}
              cy={y(v)}
              r="14"
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
        {/* Direct label on the latest point only. */}
        <text
          x={x(last) + 8}
          y={y(WEEKLY_PROSPECTS[last]!) + 4}
          className="fill-foreground"
          fontSize="12"
          fontWeight="600"
        >
          {WEEKLY_PROSPECTS[last]}
        </text>
        <text x={PLOT_LEFT} y={H - 12} className="fill-muted-foreground" fontSize="10">
          8 weeks ago
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
            top: `${((y(WEEKLY_PROSPECTS[hover]!) - 8) / H) * 100}%`,
          }}
        >
          <span className="font-medium">{WEEKLY_PROSPECTS[hover]}</span>{" "}
          <span className="text-muted-foreground">
            prospects, {hover === WEEKLY_PROSPECTS.length - 1 ? "this week" : `${WEEKLY_PROSPECTS.length - 1 - hover} wk ago`}
          </span>
        </div>
      )}
    </div>
  )
}

function SourcesChart() {
  const max = Math.max(...SOURCES.map((s) => s.value))
  return (
    <div className="space-y-4 pt-1">
      {SOURCES.map((source) => (
        <div key={source.label}>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-medium">{source.label}</span>
            <span className="text-muted-foreground">{source.value} people</span>
          </div>
          <div className="h-3 overflow-hidden rounded-r-[4px] bg-muted">
            <div
              className="h-full rounded-r-[4px]"
              style={{
                width: `${(source.value / max) * 100}%`,
                backgroundColor: source.colorVar,
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Prospects Paraden discovers arrive without email addresses until they are
        enriched; uploads keep the emails you provide.
      </p>
    </div>
  )
}

/** Two dashboard preview charts running on clearly marked sample data. */
export function SampleCharts() {
  return (
    <div className={`grid gap-6 md:grid-cols-2 ${SERIES_VARS}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Prospects found per week</CardTitle>
            <Badge variant="secondary">Sample data</Badge>
          </div>
          <CardDescription>
            How your pipeline fills over time. Sample numbers for now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Where prospects come from</CardTitle>
            <Badge variant="secondary">Sample data</Badge>
          </div>
          <CardDescription>
            Uploads versus Paraden's own discovery. Sample numbers for now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SourcesChart />
        </CardContent>
      </Card>
    </div>
  )
}
