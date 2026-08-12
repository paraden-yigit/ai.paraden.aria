import { useState } from "react"

import { CampaignStatus } from "./CampaignStatus"
import { CampaignTrend, type TrendPoint } from "./CampaignTrend"
import { DateRangePicker } from "./DateRangePicker"
import { SERIES } from "./campaignSeries"
import { presetRange, type DateRange } from "@/lib/dateRanges"
import { cn } from "@/lib/utils"
import type { OutreachRun } from "@/types/outreach"

const NUMBER = new Intl.NumberFormat("en-GB")

/**
 * Stand-in figures until sending is wired to this page.
 *
 * Fourteen days rather than a month: enough to read as daily without turning
 * four bars a day into a picket fence, and shaped like real sending — weekdays
 * busy, weekends nearly still, each measure a fraction of the one before it.
 */
const DUMMY_TREND: TrendPoint[] = [
  { label: "1", sent: 52, opens: 24, replies: 4, positive: 1 },
  { label: "2", sent: 61, opens: 29, replies: 5, positive: 2 },
  { label: "3", sent: 58, opens: 25, replies: 3, positive: 1 },
  { label: "4", sent: 64, opens: 31, replies: 6, positive: 2 },
  { label: "5", sent: 49, opens: 21, replies: 4, positive: 1 },
  { label: "6", sent: 8, opens: 3, replies: 0, positive: 0 },
  { label: "7", sent: 6, opens: 2, replies: 1, positive: 0 },
  { label: "8", sent: 70, opens: 34, replies: 7, positive: 3 },
  { label: "9", sent: 74, opens: 39, replies: 8, positive: 2 },
  { label: "10", sent: 68, opens: 30, replies: 5, positive: 2 },
  { label: "11", sent: 72, opens: 36, replies: 9, positive: 4 },
  { label: "12", sent: 66, opens: 28, replies: 6, positive: 2 },
  { label: "13", sent: 9, opens: 4, replies: 1, positive: 0 },
  { label: "14", sent: 7, opens: 3, replies: 0, positive: 0 },
]

/**
 * How the campaign is doing: the daily plot, and the totals under it.
 *
 * Until it is sending there is nothing to plot, so the chart is shown as what
 * it is — the shape of the answer, greyed and out of focus, with the reason on
 * top. Blurring rather than hiding keeps the page the same page before and
 * after launch.
 */
export function CampaignPerformance({
  run,
  running,
  launched,
}: {
  run: OutreachRun | null
  running: boolean
  launched: boolean
}) {
  // Month to date by default: the period anyone checking on a campaign means
  // when they have not said. It belongs to this view rather than to the
  // campaign — the other three are not read over a period.
  const [range, setRange] = useState<DateRange>(() => presetRange("this_month"))

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <div className="relative">
        <div
          className={cn(
            "rounded-xl border p-6",
            !running && "pointer-events-none blur-[3px] grayscale-100 select-none",
          )}
          aria-hidden={!running}
        >
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">Daily performance</h2>
            <p className="text-xs text-muted-foreground">
              Sample figures — the period above does not filter them.
            </p>
          </div>
          <CampaignTrend data={DUMMY_TREND} />
        </div>

        {!running && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="max-w-sm rounded-xl border bg-card/85 px-6 py-5 text-center shadow-sm backdrop-blur-sm">
              <p className="font-medium">Nothing to report yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {launched
                  ? "This campaign has launched but has not sent anything yet."
                  : "This campaign is not running. Figures appear once it launches and starts sending."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* The same four measures as totals. Not decoration: the plot answers
        * "which way is this going", and these answer "how much" — and they are
        * the visible labels the aqua and yellow series need, both of which sit
        * under 3:1 against a light surface. */}
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
          !running && "pointer-events-none opacity-50 grayscale-100",
        )}
        aria-hidden={!running}
      >
        {SERIES.map((series) => {
          // A campaign that has not sent has sent nothing: zero, not the sample
          // figures greyed out. The plot above is a shape to expect; these are
          // counts, and a count nobody has earned yet is 0.
          const total = running
            ? DUMMY_TREND.reduce((sum, point) => sum + point[series.key], 0)
            : 0
          return (
            <div key={series.key} className="rounded-xl border p-5">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ background: series.color }}
                />
                {series.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {NUMBER.format(total)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Below the counts, because it is the same figures asked a different
        * way: not "how many" but "how far through". */}
      {run && <CampaignStatus run={run} />}
    </div>
  )
}
