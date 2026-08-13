import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CampaignStatus } from "./CampaignStatus"
import { CampaignTrend, type TrendPoint } from "./CampaignTrend"
import { DateRangePicker } from "./DateRangePicker"
import { SERIES } from "./campaignSeries"
import { useAsync } from "@/hooks/useAsync"
import { formatDayShort } from "@/lib/format"
import { presetRange, type DateRange } from "@/lib/dateRanges"
import { outreachService } from "@/services/outreach.service"
import { cn } from "@/lib/utils"
import type { OutreachRun } from "@/types/outreach"

const NUMBER = new Intl.NumberFormat("en-GB")

/**
 * How the campaign is doing: the daily plot, and the totals under it.
 *
 * Both come from one request over the period above them — the totals are the
 * API's own, not the plot re-added here, so the two cannot drift.
 *
 * A campaign with nothing in the period is shown as what it is: the chart
 * greyed and out of focus, with the reason on top. Blurring rather than hiding
 * keeps the page the same page before and after the first send, and the empty
 * grid underneath is the shape of the answer rather than a claim about it.
 */
export function CampaignPerformance({ run }: { run: OutreachRun | null }) {
  // Month to date by default: the period anyone checking on a campaign means
  // when they have not said. It belongs to this view rather than to the
  // campaign — the other three are not read over a period.
  const [range, setRange] = useState<DateRange>(() => presetRange("this_month"))

  const runId = run?.id ?? null
  const load = useCallback(
    () =>
      runId === null
        ? Promise.resolve(null)
        : outreachService.performance(runId, range),
    [runId, range],
  )
  const { data, loading, error, refetch } = useAsync(load, [load])

  const points: TrendPoint[] = (data?.points ?? []).map((point) => ({
    label: formatDayShort(point.day),
    sent: point.sent,
    opens: point.opens,
    replies: point.replies,
    positive: point.positive,
  }))
  const totals = data?.totals ?? {}
  // Nothing happened in this period — which is a different fact from the
  // request having failed, and from the campaign not having started.
  const silent = points.every(
    (point) => !point.sent && !point.opens && !point.replies && !point.positive,
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div
            className={cn(
              "rounded-xl border p-6",
              silent && !loading &&
                "pointer-events-none blur-[3px] grayscale-100 select-none",
            )}
            aria-hidden={silent && !loading}
          >
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">Daily performance</h2>
              <p className="text-xs text-muted-foreground">
                Every day in the period, quiet ones included.
              </p>
            </div>
            {loading ? (
              <Skeleton className="h-[170px] w-full" />
            ) : (
              <CampaignTrend data={points} />
            )}
          </div>

          {silent && !loading && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="max-w-sm rounded-xl border bg-card/85 px-6 py-5 text-center shadow-sm backdrop-blur-sm">
                <p className="font-medium">Nothing to report yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {run?.status === "paused"
                    ? "This campaign is paused, and sent nothing in this period. Resume it to pick up where it left off."
                    : run?.status === "running" || run?.status === "launched"
                      ? "This campaign is going, but sent nothing in this period."
                      : "This campaign has not started. Figures appear once it launches and starts sending."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* The same four measures as totals. Not decoration: the plot answers
        * "which way is this going", and these answer "how much" — and they are
        * the visible labels the aqua and yellow series need, both of which sit
        * under 3:1 against a light surface. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SERIES.map((series) => (
          <div key={series.key} className="rounded-xl border p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ background: series.color }}
              />
              {series.label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-16" />
            ) : (
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {NUMBER.format(totals[series.key] ?? 0)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Below the counts, because it is the same figures asked a different
        * way: not "how many" but "how far through". */}
      {run && <CampaignStatus run={run} />}
    </div>
  )
}
