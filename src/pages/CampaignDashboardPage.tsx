import { useCallback, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Rocket } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataState } from "@/components/DataState"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAsync } from "@/hooks/useAsync"
import { outreachService } from "@/services/outreach.service"
import { CAMPAIGN_TYPES } from "@/features/outreach/campaignTypes"
import { CampaignCompanies } from "@/features/outreach/CampaignCompanies"
import { CampaignIcp } from "@/features/outreach/CampaignIcp"
import { CampaignPerformance } from "@/features/outreach/CampaignPerformance"

const TABS = [
  { value: "performance", label: "Performance" },
  { value: "icp", label: "ICP" },
  { value: "companies", label: "Companies" },
  { value: "contacts", label: "Prospects" },
] as const

/**
 * One campaign, after it has been created.
 *
 * Four views of the same thing, down the side: how it is doing, who it was
 * aimed at, which companies, which people. Only what belongs to the campaign
 * rather than to a view sits in the header above them — its name, and whether
 * it has launched. The period is a Performance control and lives there.
 */
export function CampaignDashboardPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const runId = Number(id)

  const fetchRun = useCallback(() => outreachService.get(runId), [runId])
  const { data: run, loading, error, refetch } = useAsync(fetchRun, [fetchRun])

  const type = CAMPAIGN_TYPES.find((o) => o.value === run?.campaign_type)
  const launched = run?.status === "launched"
  // Only a started campaign is sending, and only sending produces figures. A
  // Flow campaign runs; a Strategic one is launched once. Both are "going".
  const running = run?.status === "running" || launched
  // Only a Flow campaign can be started from here: a Strategic one sends a
  // written list, and writing it is a step that does not exist yet.
  const startable = run?.campaign_type === "flow" && !running
  const [starting, setStarting] = useState(false)

  async function start() {
    if (!run) return
    setStarting(true)
    try {
      await outreachService.start(run.id)
      toast.success("Campaign started.")
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start it.")
    } finally {
      setStarting(false)
    }
  }

  // Kept in the page rather than the URL: these are four views of one campaign,
  // not four places.
  const [tab, setTab] = useState<string>(TABS[0].value)

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
        // one.
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
          <div className="flex items-center gap-2">
            {/* A Flow campaign can be started here; a Strategic one cannot,
              * and the title says why rather than leaving a dead button to
              * puzzle over. */}
            <span
              title={
                running
                  ? "This campaign is already going."
                  : startable
                    ? undefined
                    : "A Strategic campaign sends a written list, and the step that writes it is not back in the flow yet."
              }
            >
              <Button
                disabled={!startable || starting}
                onClick={() => void start()}
              >
                {starting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Rocket className="size-4" />
                )}
                {running
                  ? launched
                    ? "Launched"
                    : "Running"
                  : starting
                    ? "Starting…"
                    : "Launch campaign"}
              </Button>
            </span>
          </div>
        </div>

        {/* Underlined, directly under the name: the sections belong to this
          * campaign, and a rule across the page is what says "everything below
          * is inside the thing above". The `line` variant is the same treatment
          * the rest of the app uses for in-page sections. */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList
            variant="line"
            className="w-full justify-start gap-6 rounded-none border-b p-0 pb-[5px]"
          >
            {TABS.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="flex-none px-0"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6 min-w-0">
            <TabsContent value="performance" className="mt-0">
              <CampaignPerformance
                run={run ?? null}
                running={running}
                launched={launched}
              />
            </TabsContent>

            <TabsContent value="icp" className="mt-0">
              <CampaignIcp
                runId={runId}
                icp={run?.icp ?? null}
                campaignType={run?.campaign_type ?? null}
              />
            </TabsContent>

            <TabsContent value="companies" className="mt-0">
              <CampaignCompanies
                runId={runId}
                campaignType={run?.campaign_type ?? null}
              />
            </TabsContent>

            <TabsContent value="contacts" className="mt-0">
              {/* Nothing to list and nothing pretending otherwise: prospects
                * are created by sending, and no campaign is sending yet. */}
              <div className="rounded-xl border border-dashed py-20 text-center">
                <p className="text-sm text-muted-foreground">
                  Nobody has been contacted yet. The people this campaign
                  reaches will be listed here once it starts sending.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DataState>
    </div>
  )
}
