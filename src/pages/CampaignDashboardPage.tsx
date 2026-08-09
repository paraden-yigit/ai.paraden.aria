import { useCallback, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Rocket } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataState } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { outreachService } from "@/services/outreach.service"
import { CAMPAIGN_TYPES } from "@/features/outreach/campaignTypes"
import { cn } from "@/lib/utils"
import { CampaignTrend, type TrendPoint } from "@/features/outreach/CampaignTrend"
import { SERIES } from "@/features/outreach/campaignSeries"
import { DateRangePicker } from "@/features/outreach/DateRangePicker"
import { presetRange, type DateRange } from "@/lib/dateRanges"

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
 * One campaign, after it has been created.
 *
 * Deliberately empty for now: the wizard ends here, so the route has to exist
 * and has to say which campaign you are looking at. What belongs on it — what
 * has been sent, who replied, how the pool is holding up — is not built yet,
 * and a page full of invented placeholders would be a worse answer than an
 * honest blank one.
 */
export function CampaignDashboardPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const runId = Number(id)

  const fetchRun = useCallback(() => outreachService.get(runId), [runId])
  const { data: run, loading, error, refetch } = useAsync(fetchRun, [fetchRun])

  const type = CAMPAIGN_TYPES.find((o) => o.value === run?.campaign_type)
  const launched = run?.status === "launched"
  // Only a launched campaign is sending, and only sending produces figures.
  const running = launched

  // Month to date by default: the period anyone checking on a campaign means
  // when they have not said. Nothing reads it yet — the figures below are
  // stand-ins — so it moves the label and nothing else.
  const [range, setRange] = useState<DateRange>(() => presetRange("this_month"))

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => navigate("/campaigns")}
      >
        <ArrowLeft className="size-4" />
        Campaigns
      </Button>

      <DataState
        loading={loading}
        error={error}
        // A campaign either loads or it does not; there is no empty version of
        // one, and the page's own blankness is the point rather than a state.
        isEmpty={false}
        emptyMessage=""
        onRetry={refetch}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {run?.name}
            </h1>
            {type && (
              <Badge variant="outline" className="gap-1.5 font-normal">
                <type.icon className="size-3.5" aria-hidden />
                {type.label}
              </Badge>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Disabled, and the title says why. Launching enrols people and
              * puts mail on the wire, so a button that looked live and then
              * failed on the server would be worse than one that admits it is
              * waiting on the step that writes everyone's emails. */}
            <span
              title={
                launched
                  ? "This campaign has already been launched."
                  : "Not yet: a campaign can only launch once every prospect's emails have been written, and that step is not back in the flow."
              }
            >
              <Button disabled>
                <Rocket className="size-4" />
                {launched ? "Launched" : "Launch campaign"}
              </Button>
            </span>
            <DateRangePicker value={range} onChange={setRange} />
          </div>
        </div>

        {/* Until a campaign is sending there is nothing to plot, so the chart
          * is shown as what it is: the shape of the answer, greyed and out of
          * focus, with the reason on top of it. Blurring rather than hiding
          * keeps the page the same page before and after launch. */}
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

        {/* The same three numbers as totals. Not decoration: the plot answers
          * "which way is this going", and these answer "how much" — and they
          * are the visible labels the aqua and yellow series need, both of
          * which sit under 3:1 against a light surface. */}
        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
            // Greyed with the chart they summarise. Left legible rather than
            // blurred: a dash reads as "none", and these are "not yet".
            !running && "pointer-events-none opacity-50 grayscale-100",
          )}
          aria-hidden={!running}
        >
          {SERIES.map((series) => {
            // A campaign that has not sent has sent nothing: zero, not the
            // sample figures greyed out. The plot above is a shape to expect;
            // these are counts, and a count nobody has earned yet is 0.
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
      </DataState>
    </div>
  )
}
