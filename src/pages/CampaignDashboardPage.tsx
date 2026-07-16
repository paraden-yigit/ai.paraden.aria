import { useCallback, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  AtSign,
  Building2,
  CalendarRange,
  CheckCircle2,
  Loader2,
  Package,
  PartyPopper,
  Play,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { SavedSequence } from "@/features/campaigns/SavedSequence"
import { loadContactStats } from "@/features/campaigns/contactStats"
import { useAsync } from "@/hooks/useAsync"
import { formatDateTime } from "@/lib/format"
import { ApiError } from "@/services/http"
import { campaignService } from "@/services/campaign.service"
import type { CampaignMetrics, CampaignStatus } from "@/types/campaign"
import { useCampaignContext } from "@/features/campaigns/useCampaignContext"
import { campaignEmailService } from "@/services/campaign-email.service"

/** Total span of the sequence in working days (sum of the configured gaps). */
function sequenceSpanDays(gaps: (number | null)[]): number {
  return gaps.reduce<number>((sum, gap) => sum + (gap ?? 0), 0)
}

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  running: "Running",
  completed: "Completed",
}

const STATUS_VARIANT: Record<
  CampaignStatus,
  "secondary" | "default" | "outline"
> = {
  draft: "secondary",
  running: "default",
  completed: "outline",
}

/** A whole-number count, thousands-separated. */
function formatCount(value: number): string {
  return value.toLocaleString()
}

/** A derived rate ``num / denom`` as a percent string (one decimal), or "—"
 * when the denominator is zero. */
function rate(num: number, denom: number): string {
  if (denom <= 0) return "—"
  return `${((num / denom) * 100).toFixed(1)}%`
}

/** One metric stat tile: a headline count with a derived-rate caption. The
 * North Star metric (replies) is emphasised with a primary ring. */
function StatTile({
  label,
  value,
  caption,
  emphasis = false,
}: {
  label: string
  value: string
  caption: string
  emphasis?: boolean
}) {
  return (
    <Card className={emphasis ? "border-primary/60 bg-primary/5" : undefined}>
      <CardContent className="space-y-1 p-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{caption}</div>
      </CardContent>
    </Card>
  )
}

/** The nine campaign metrics as a stat-tile grid. Counts are stored; the
 * percentage rates are derived here from their funnel denominators. */
function MetricsGrid({ metrics }: { metrics: CampaignMetrics }) {
  const tiles = [
    {
      label: "Sent",
      value: formatCount(metrics.sent),
      caption: "Emails delivered",
    },
    {
      label: "Opens",
      value: formatCount(metrics.opens),
      caption: `${rate(metrics.opens, metrics.sent)} of sent`,
    },
    {
      label: "Clicks",
      value: formatCount(metrics.clicks),
      caption: `${rate(metrics.clicks, metrics.opens)} of opens`,
    },
    {
      label: "Replies",
      value: formatCount(metrics.replies),
      caption: `${rate(metrics.replies, metrics.opens)} of opens`,
      emphasis: true,
    },
    {
      label: "Bounces",
      value: formatCount(metrics.bounces),
      caption: `${rate(metrics.bounces, metrics.sent)} of sent`,
    },
    {
      label: "Unsubscribes",
      value: formatCount(metrics.unsubscribes),
      caption: `${rate(metrics.unsubscribes, metrics.opens)} of opens`,
    },
    {
      label: "Sequence completion",
      value: `${metrics.sequence_completion_rate}%`,
      caption: "Completed the full sequence",
    },
    {
      label: "Qualified leads",
      value: formatCount(metrics.qualified_leads),
      caption: `${rate(metrics.qualified_leads, metrics.replies)} of replies`,
    },
    {
      label: "Meetings booked",
      value: formatCount(metrics.meetings_booked),
      caption: `${rate(metrics.meetings_booked, metrics.qualified_leads)} of leads`,
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </div>
  )
}

export function CampaignDashboardPage() {
  const { campaign, refetch } = useCampaignContext()
  const location = useLocation()
  const justCompleted = Boolean(
    (location.state as { justCompleted?: boolean } | null)?.justCompleted,
  )
  const [busy, setBusy] = useState(false)

  const statsFetcher = useCallback(
    () => loadContactStats(campaign.id),
    [campaign.id],
  )
  const emailsFetcher = useCallback(
    () => campaignEmailService.saved(campaign.id),
    [campaign.id],
  )
  const stats = useAsync(statsFetcher, [campaign.id])
  const emails = useAsync(emailsFetcher, [campaign.id])

  const touches = campaign.sequence_touches ?? emails.data?.length ?? 0
  const spanDays = sequenceSpanDays([
    campaign.sequence_advancer_gap,
    campaign.sequence_closer_gap,
  ])
  const spanWeeks = Math.max(1, Math.round(spanDays / 5))

  const act = async (action: "run" | "complete") => {
    setBusy(true)
    try {
      await campaignService[action](campaign.id)
      toast.success(
        action === "run"
          ? "Campaign marked as running. Sending is not live yet."
          : "Campaign completed.",
      )
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Something went wrong.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {justCompleted && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PartyPopper className="size-5" />
              Your campaign is ready.
            </CardTitle>
            <CardDescription>
              ARIA has researched your prospects and drafted your outreach.
              Everything below is yours to review and refine: nothing is final
              until you decide it is.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Dashboard</h2>
            <Badge variant={STATUS_VARIANT[campaign.status]}>
              {STATUS_LABEL[campaign.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Everything this campaign has prepared, in one place.
          </p>
        </div>

        {/* Draft → Run; Running → Complete; Completed → no action. */}
        {campaign.status === "draft" && campaign.setup_completed && (
          <div className="flex flex-col items-end gap-1">
            <Button onClick={() => act("run")} disabled={busy}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Run campaign
            </Button>
            {/* Sending is not built yet (run/complete only moves the status and
                fills preview figures); drop this note when the sending layer lands. */}
            <p className="text-xs text-muted-foreground">
              Preview for now: nothing is emailed yet.
            </p>
          </div>
        )}
        {campaign.status === "running" && (
          <Button
            variant="outline"
            onClick={() => act("complete")}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Complete campaign
          </Button>
        )}
      </div>

      {campaign.metrics && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Performance
            </h3>
            <Badge variant="secondary">Sample data</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Nothing has been sent: these figures preview how results will read
            once sending is live.
          </p>
          <MetricsGrid metrics={campaign.metrics} />
        </div>
      )}

      <DataState
        loading={stats.loading}
        error={stats.error}
        isEmpty={false}
        emptyMessage="No contact data yet."
        onRetry={stats.refetch}
        skeletonRows={2}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Building2 className="size-4" />
                Companies
              </CardDescription>
              <CardTitle className="text-3xl">
                {stats.data?.companies ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              That your prospects work at.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="size-4" />
                People
              </CardDescription>
              <CardTitle className="text-3xl">
                {stats.data?.people ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Prospects across those companies.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AtSign className="size-4" />
                Ready to email
              </CardDescription>
              <CardTitle className="text-3xl">
                {stats.data?.reachable ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {stats.data && stats.data.reachable === 0
                ? "Prospects found by discovery arrive without email addresses. Contacts you upload include theirs."
                : "Prospects with an email address on file."}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CalendarRange className="size-4" />
                Sequence
              </CardDescription>
              <CardTitle className="text-3xl">
                {touches > 0 ? `${touches} emails` : "Not set"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {touches > 0
                ? `Spread over about ${spanWeeks} ${spanWeeks === 1 ? "week" : "weeks"}.`
                : "Finish setup to configure the sequence."}
            </CardContent>
          </Card>
        </div>
      </DataState>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your outreach sequence</CardTitle>
            <CardDescription>
              The emails ARIA drafted and you approved, in sending order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataState
              loading={emails.loading}
              error={emails.error}
              isEmpty={(emails.data?.length ?? 0) === 0}
              emptyMessage={
                campaign.setup_completed
                  ? "No emails are saved for this campaign."
                  : "No emails saved yet. Finish this campaign's setup from the campaigns list to draft and approve them."
              }
              onRetry={emails.refetch}
              skeletonRows={3}
            >
              {emails.data && (
                <SavedSequence campaign={campaign} emails={emails.data} />
              )}
            </DataState>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What happens next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <Link
                  to={`/campaigns/${campaign.id}/contacts`}
                  className="font-medium underline underline-offset-4"
                >
                  Review your prospect list
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  and remove anyone who does not fit.
                </span>
              </p>
              {campaign.product_id != null && (
                <p>
                  <Link
                    to={`/products/${campaign.product_id}?tab=icp`}
                    className="font-medium underline underline-offset-4"
                  >
                    Tighten your targeting
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    if the companies found are not quite right.
                  </span>
                </p>
              )}
              <p>
                <Link
                  to="/exclusions"
                  className="font-medium underline underline-offset-4"
                >
                  Keep your do-not-contact list current
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  so nobody you exclude is ever approached.
                </span>
              </p>
              <p className="border-t pt-3 text-muted-foreground">
                Your sequence and prospect list stay saved here, ready whenever
                you need them.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {campaign.product_id != null ? (
                <p>
                  <span className="text-muted-foreground">Product: </span>
                  <Link
                    to={`/products/${campaign.product_id}`}
                    className="font-medium underline underline-offset-4"
                  >
                    {campaign.product_name ?? "View product"}
                  </Link>
                </p>
              ) : (
                <p className="text-muted-foreground">No product linked.</p>
              )}
              <p className="text-muted-foreground">
                Created {formatDateTime(campaign.created_at)}
              </p>
              <p className="text-muted-foreground">
                Updated {formatDateTime(campaign.updated_at)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
