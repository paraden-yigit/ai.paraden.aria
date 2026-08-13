import { useCallback, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Pause, Play, Rocket } from "lucide-react"
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
import { CampaignProspects } from "@/features/outreach/CampaignProspects"
import { CampaignSettings } from "@/features/outreach/CampaignSettings"
import { LaunchDialog } from "@/features/outreach/LaunchDialog"
import { RunStatusBadge } from "@/features/outreach/runStatus"

const TABS = [
  { value: "performance", label: "Performance" },
  { value: "icp", label: "ICP" },
  { value: "companies", label: "Companies" },
  { value: "contacts", label: "Prospects" },
  { value: "settings", label: "Settings" },
] as const

/**
 * One campaign, after it has been created.
 *
 * Five views of the same thing, down the side: how it is doing, who it was
 * aimed at, which companies, which people, and what can still be changed. Only
 * what belongs to the campaign rather than to a view sits in the header above them — its name, and whether
 * it has launched. The period is a Performance control and lives there.
 */
export function CampaignDashboardPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const runId = Number(id)

  const fetchRun = useCallback(() => outreachService.get(runId), [runId])
  const { data: run, loading, error, refetch } = useAsync(fetchRun, [fetchRun])

  const type = CAMPAIGN_TYPES.find((o) => o.value === run?.campaign_type)
  // The one-shot launch of the older flow. It has no pause: its whole sequence
  // was handed to the queue in one go.
  const launched = run?.status === "launched"
  const running = run?.status === "running"
  const paused = run?.status === "paused"
  // Either kind can be started: both are a standing instruction against a pool
  // of people, and the only difference is whether the companies were described
  // or named. A paused one is resumed rather than started — that is the button
  // below, not this one.
  const startable = Boolean(run) && !running && !paused && !launched
  const [confirming, setConfirming] = useState(false)
  const [starting, setStarting] = useState(false)
  // A pause or a resume in flight. Its own flag: it is a different button from
  // the launch dialog's, and one spinner for both would freeze the wrong one.
  const [switching, setSwitching] = useState(false)

  /** Save what the dialog was shown with, then start. */
  async function start(settings: {
    monthly_reach: number
    review_days: number
  }) {
    if (!run) return
    setStarting(true)
    try {
      // Two calls rather than one: starting is not the place to also be a
      // settings endpoint, and a campaign that started on figures nobody
      // stored would be worse than one that failed to start.
      await outreachService.updateSettings(run.id, settings)
      await outreachService.start(run.id)
      toast.success("Campaign started.")
      setConfirming(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start it.")
    } finally {
      setStarting(false)
    }
  }

  /**
   * Stop the campaign, or start it again where it left off.
   *
   * No confirmation on either. Pausing is the safe direction and is undone by
   * the button it turns into; resuming picks up a campaign the same person
   * paused, with its pool, its plan and its queue untouched.
   */
  async function toggleRunning(next: "pause" | "resume") {
    if (!run) return
    setSwitching(true)
    try {
      const updated =
        next === "pause"
          ? await outreachService.pause(run.id)
          : await outreachService.resume(run.id)
      toast.success(
        updated.status === "paused"
          ? "Campaign paused. Nothing more will be found, written or sent."
          : "Campaign running again, where it left off.",
      )
      refetch()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : next === "pause"
            ? "Could not pause it."
            : "Could not resume it.",
      )
    } finally {
      setSwitching(false)
    }
  }

  // Kept in the page rather than the URL: these are views of one campaign,
  // not separate places.
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
            {/* What it is doing, beside what it is. The button says what
              * pressing it would change; this says where the campaign stands
              * whether or not anybody is about to press anything. */}
            {run && <RunStatusBadge status={run.status} />}
          </div>
          <div className="flex items-center gap-2">
            {/* One button, three campaigns: a running one is stopped, a paused
              * one is started again, and one that has never gone is launched
              * through the dialog. Whatever the campaign is doing, the button
              * says what pressing it will do instead. */}
            {running ? (
              <Button
                variant="outline"
                disabled={switching}
                onClick={() => void toggleRunning("pause")}
              >
                <Pause className="size-4" />
                Pause campaign
              </Button>
            ) : paused ? (
              <Button
                disabled={switching}
                onClick={() => void toggleRunning("resume")}
              >
                <Play className="size-4" />
                Resume campaign
              </Button>
            ) : (
              <span title={launched ? "This campaign is already going." : undefined}>
                {/* Opens the dialog rather than starting: the two figures that
                  * decide what happens next are confirmed first. */}
                <Button
                  disabled={!startable || starting}
                  onClick={() => setConfirming(true)}
                >
                  <Rocket className="size-4" />
                  {launched ? "Launched" : "Launch campaign"}
                </Button>
              </span>
            )}
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
              <CampaignPerformance run={run ?? null} />
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
              <CampaignProspects
                runId={runId}
                campaignType={run?.campaign_type ?? null}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              {/* Keyed on the campaign's last change: saving reloads the run,
                * which re-mounts this with the stored values rather than
                * leaving the fields holding what was typed. */}
              {run && (
                <CampaignSettings
                  key={run.updated_at}
                  run={run}
                  onSaved={refetch}
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DataState>

      {run && (
        <LaunchDialog
          run={run}
          open={confirming}
          onOpenChange={setConfirming}
          onConfirm={(settings) => void start(settings)}
          launching={starting}
        />
      )}
    </div>
  )
}
