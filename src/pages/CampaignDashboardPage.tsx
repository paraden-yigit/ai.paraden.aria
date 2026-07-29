import { useCallback, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  AtSign,
  Ban,
  Building2,
  CalendarRange,
  CheckCircle2,
  Info,
  ListChecks,
  Loader2,
  MailOpen,
  MailX,
  Package,
  PartyPopper,
  Play,
  Reply,
  Send,
  ThumbsDown,
  ThumbsUp,
  Users,
  type LucideIcon,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DataState } from "@/components/DataState"
import { Disclosure } from "@/components/Disclosure"
import { MetricTile } from "@/components/MetricTile"
import { SavedSequence } from "@/features/campaigns/SavedSequence"
import { SendingSummaryCard } from "@/features/campaigns/SendingSummaryCard"
import {
  loadContactStats,
  type ContactStats,
} from "@/features/campaigns/contactStats"
import { preparingStage } from "@/features/campaigns/status"
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
  preparing: "Preparing",
  ready_to_send: "Ready to send",
  running: "Running",
  enrichment_failed: "Enrichment failed",
  completed: "Completed",
}

const STATUS_VARIANT: Record<
  CampaignStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
  draft: "secondary",
  preparing: "secondary",
  ready_to_send: "default",
  running: "default",
  enrichment_failed: "destructive",
  completed: "outline",
}

/** A whole-number count, thousands-separated. */
function formatCount(value: number): string {
  return value.toLocaleString()
}

/** A derived rate ``num / denom`` as a percent string (one decimal), or "n/a"
 * when the denominator is zero. */
function rate(num: number, denom: number): string {
  if (denom <= 0) return "n/a"
  return `${((num / denom) * 100).toFixed(1)}%`
}

/**
 * The counting caveats, on an info button beside the Performance heading.
 *
 * A popover rather than a tooltip: this is five sentences, and a tooltip that
 * long cannot be read on a touch screen, cannot be kept open while you look
 * back at the numbers, and cannot have its text selected. Same affordance, same
 * place, but it behaves like something you are meant to read.
 */
function CountingNote() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
          aria-label="How these figures are counted"
        >
          <Info className="size-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 text-sm">
        <p className="font-medium">How these are counted</p>
        <p className="mt-2 text-muted-foreground">
          Every figure here is real, recounted from the send and reply logs each
          time this page loads. Opens count prospects whose mail client loaded
          the tracking image, so they undercount anyone who blocks images and
          overcount privacy proxies that load it for them. Replies count
          prospects who wrote back, so an out-of-office or a bounce notice is
          not one. Success, Fail and Opt-out are how their latest reply was
          read; a reply that fitted none of the three is counted in Replies but
          in no outcome tile. Bounces only count rejections we see at the moment
          of sending.
        </p>
      </PopoverContent>
    </Popover>
  )
}

/** One line of campaign make-up: what the list is built from. A definition row
 * rather than a card, because these describe setup and should not compete with
 * the funnel above them. */
function MakeUp({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: LucideIcon
  label: string
  value: string
  caption: string
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-0.5">
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {caption}
        </span>
      </dd>
    </div>
  )
}

/** One quiet diagnostic in the secondary bar: icon, label, value, rate. */
function Diagnostic({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon
  label: string
  value: string
  detail?: string
}) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
      <span className="font-medium tabular-nums text-foreground">{value}</span>
      {detail && <span>({detail})</span>}
    </span>
  )
}

/** The campaign's funnel with a hierarchy instead of nine equal boxes: six
 * headline tiles (replies is the North Star, then what those replies were), and
 * the health diagnostics in one slim bar. Counts are stored; the percentage rates
 * are derived here from their funnel denominators.
 *
 * The three outcome tiles come from the reply categoriser and are counted per
 * prospect, so they are mutually exclusive and never add up to more than
 * `replies` — anything left over is a reply that was none of the three. */
function MetricsGrid({ metrics }: { metrics: CampaignMetrics }) {
  return (
    <div className="space-y-3">
      {/* Six tiles, in this order, deliberately identical to the home
          dashboard's PerformanceStrip so the two read as one funnel. Do not
          reorder or relabel one without the other. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile
          icon={Send}
          label="Sent"
          value={formatCount(metrics.sent)}
          caption="Emails delivered"
        />
        <MetricTile
          icon={MailOpen}
          label="Opens"
          value={formatCount(metrics.opens)}
          // Prospects, not messages — one person opening a reply re-fires the
          // pixels of every earlier email in the thread, so a per-message rate
          // would read far too high. "% of sent" would also divide prospects by
          // messages, which a multi-step sequence makes meaningless.
          caption="unique prospects"
        />
        <MetricTile
          icon={Reply}
          label="Replies"
          value={formatCount(metrics.replies)}
          // Prospects who answered, so it shares the Opens denominator. Excludes
          // out-of-office and bounce notifications, which are not people replying.
          caption={`${rate(metrics.replies, metrics.opens)} of opens`}
          emphasis
        />
        <MetricTile
          icon={ThumbsUp}
          label="Success"
          value={formatCount(metrics.success)}
          caption={`${rate(metrics.success, metrics.replies)} of replies`}
        />
        <MetricTile
          icon={ThumbsDown}
          label="Fail"
          value={formatCount(metrics.fail)}
          caption={`${rate(metrics.fail, metrics.replies)} of replies`}
        />
        <MetricTile
          icon={Ban}
          label="Opt-out"
          value={formatCount(metrics.opt_out)}
          caption={`${rate(metrics.opt_out, metrics.replies)} of replies`}
        />
      </div>
      {/* Clicks and unsubscribes used to sit here and were structurally always
          zero: nothing tracks either yet (_METRIC_COLUMNS, api
          campaign_service.py). Removed on the same reasoning Yigit used when he
          dropped the permanently-zero qualified-leads and meetings-booked
          tiles: a number that can never move teaches people to stop reading the
          row it lives in. They come back when something feeds them. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
        <Diagnostic
          icon={MailX}
          label="Bounces"
          value={formatCount(metrics.bounces)}
          detail={`${rate(metrics.bounces, metrics.sent)} of sent`}
        />
        <Diagnostic
          icon={ListChecks}
          label="Sequence completion"
          value={`${metrics.sequence_completion_rate}%`}
        />
      </div>
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

  // Deferred on purpose: loadContactStats pages the entire contact list, up to
  // 25 sequential requests, and the make-up section it feeds is collapsed. The
  // fetcher is inert until the section is opened, at which point `statsOpened`
  // changes and useAsync re-runs it for real.
  const [statsOpened, setStatsOpened] = useState(false)
  const openStats = useCallback(() => setStatsOpened(true), [])
  const statsFetcher = useCallback(
    () => (statsOpened ? loadContactStats(campaign.id) : Promise.resolve(null)),
    [campaign.id, statsOpened],
  )
  const emailsFetcher = useCallback(
    () => campaignEmailService.saved(campaign.id),
    [campaign.id],
  )
  const stats = useAsync<ContactStats | null>(statsFetcher, [
    campaign.id,
    statsOpened,
  ])
  const emails = useAsync(emailsFetcher, [campaign.id])

  const touches = campaign.sequence_touches ?? emails.data?.length ?? 0
  const spanDays = sequenceSpanDays([
    campaign.sequence_advancer_gap,
    campaign.sequence_closer_gap,
  ])
  const spanWeeks = Math.max(1, Math.round(spanDays / 5))

  // One sentence of real state, rather than "Everything this campaign has
  // prepared, in one place", which was true of every campaign in every status
  // and so told the reader nothing.
  const m = campaign.metrics
  const headline = (() => {
    switch (campaign.status) {
      case "draft":
        return campaign.setup_completed
          ? "Ready to run. Nothing sends until you start it."
          : "Setup is not finished yet."
      case "preparing":
        return preparingStage(campaign) === "composing"
          ? "Composing each prospect's emails. Nothing sends until you approve them."
          : "Finding work email addresses, then composing each prospect's emails."
      case "ready_to_send":
        return "Contacts found and emails composed. Review them, then start sending."
      case "enrichment_failed":
        return "Something went wrong finding contact details."
      case "completed":
        return m && m.replies > 0
          ? `Finished. ${formatCount(m.sent)} sent, ${formatCount(m.replies)} replied.`
          : `Finished. ${formatCount(m?.sent ?? 0)} emails sent.`
      case "running":
        if (!m || m.sent === 0) return "Running. The first emails go out shortly."
        return m.replies > 0
          ? `${formatCount(m.sent)} sent so far, ${formatCount(m.replies)} replied.`
          : `${formatCount(m.sent)} sent so far, no replies yet.`
    }
  })()

  const run = async () => {
    setBusy(true)
    try {
      await campaignService.run(campaign.id)
      toast.success(
        "Finding contact emails and composing the sequences… this can take a few minutes. Nothing sends until you approve it.",
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

  const startSending = async () => {
    setBusy(true)
    try {
      await campaignService.startSending(campaign.id)
      toast.success("Sending started. The first emails go out shortly.")
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
              Paraden has researched your prospects and drafted your outreach.
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
          {/* The spinner sits with the sentence, not just on the disabled
              button, so the page reads as working even when the button is
              scrolled out of view on a narrow window. */}
          <p className="flex items-center gap-2 text-muted-foreground">
            {campaign.status === "preparing" && (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            )}
            {headline}
          </p>
          {campaign.status === "enrichment_failed" && (
            <p className="mt-1 text-sm text-destructive">
              {campaign.enrichment_error ??
                "Contact enrichment failed. Try running the campaign again."}
            </p>
          )}
        </div>

        {/* Two deliberate presses: Run prepares (contacts + emails), then Start
            sending approves what was composed. Once running there is nothing left
            to press — the campaign completes itself when every prospect has
            finished their sequence. */}
        {(campaign.status === "draft" ||
          campaign.status === "enrichment_failed") &&
          campaign.setup_completed && (
            <div className="flex flex-col items-end gap-1">
              <Button onClick={run} disabled={busy}>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                {campaign.status === "enrichment_failed"
                  ? "Retry enrichment"
                  : "Run campaign"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Finds work emails and composes each prospect's emails. Nothing
                sends until you approve them.
              </p>
            </div>
          )}
        {campaign.status === "preparing" && (
          <Button variant="outline" disabled>
            <Loader2 className="size-4 animate-spin" />
            {preparingStage(campaign) === "composing"
              ? "Composing emails…"
              : "Finding contact emails…"}
          </Button>
        )}
        {campaign.status === "ready_to_send" && (
          <div className="flex flex-col items-end gap-1">
            <Button onClick={startSending} disabled={busy}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Start sending
            </Button>
            <p className="text-xs text-muted-foreground">
              Starts sending the emails in the Outbox, on your sending
              schedule.
            </p>
          </div>
        )}
        {campaign.status === "completed" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4" />
            Every prospect has finished their sequence.
          </div>
        )}
      </div>

      {(campaign.status === "running" || campaign.status === "completed") && (
        <SendingSummaryCard campaignId={campaign.id} />
      )}

      {campaign.metrics && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">
              Performance
            </h3>
            <CountingNote />
          </div>
          <MetricsGrid metrics={campaign.metrics} />
        </div>
      )}

      {/* Make-up is setup, not performance, so it is collapsed. It also pays for
          itself: loadContactStats pages the whole contact list, up to 25
          sequential requests, and this defers that until someone asks. */}
      <Disclosure
        id={`campaign-makeup-${campaign.id}`}
        label="Campaign make-up"
        icon={Building2}
        onFirstOpen={openStats}
      >
        {statsOpened ? (
          <DataState
            loading={stats.loading}
            error={stats.error}
            isEmpty={false}
            emptyMessage="No contact data yet."
            onRetry={stats.refetch}
            skeletonRows={2}
          >
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
              <MakeUp
                icon={Building2}
                label="Companies"
                value={formatCount(stats.data?.companies ?? 0)}
                caption="That your prospects work at."
              />
              <MakeUp
                icon={Users}
                label="People"
                value={formatCount(stats.data?.people ?? 0)}
                caption="Prospects across those companies."
              />
              <MakeUp
                icon={AtSign}
                label="Ready to email"
                value={formatCount(stats.data?.reachable ?? 0)}
                caption={
                  stats.data && stats.data.reachable === 0
                    ? "Prospects found by discovery arrive without email addresses. Contacts you upload include theirs."
                    : "Prospects with an email address on file."
                }
              />
              <MakeUp
                icon={CalendarRange}
                label="Sequence"
                value={touches > 0 ? `${touches} emails` : "Not set"}
                caption={
                  touches > 0
                    ? `Spread over about ${spanWeeks} ${spanWeeks === 1 ? "week" : "weeks"}.`
                    : "Finish setup to configure the sequence."
                }
              />
            </dl>
          </DataState>
        ) : null}
      </Disclosure>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your outreach sequence</CardTitle>
            <CardDescription>
              The emails Paraden drafted and you approved, in sending order.
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
              {/* SavedSequence already gives every step its own open/close
                  toggle, so wrapping the lot in one more disclosure made
                  reading a single email a two-click job. The steps are the
                  disclosures; they just all start closed here. */}
              {emails.data && (
                <SavedSequence
                  campaign={campaign}
                  emails={emails.data}
                  startCollapsed
                />
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
