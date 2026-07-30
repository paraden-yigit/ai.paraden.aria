import { useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertCircle,
  Check,
  Loader2,
  MailCheck,
  Play,
  RotateCcw,
  Send,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ApiError } from "@/services/http"
import { campaignService } from "@/services/campaign.service"
import type { Campaign } from "@/types/campaign"
import { preparingStage } from "./status"

/**
 * Whether the API sends a "your campaign is ready to review" notification.
 *
 * Yigit's lane (email plus a browser notification, agreed 28 July). Nothing
 * sends one today, so the preparing panel promises only what actually happens:
 * flip this to `true` when the notification is live and the line appears.
 */
const CAMPAIGN_READY_NOTIFICATIONS = false

/*
 * Why "Run campaign" is not pressable yet.
 *
 * `POST /api/campaigns/{id}/run` always stops at `ready_to_send`; there is no
 * parameter that carries straight on into sending. Peter asked for the direct
 * path on the 28 July call ("it will go into your outbox and it will go straight
 * away"), so the button is built, explained and sitting in its place, and says
 * why it cannot be used. Chaining the two calls in the browser was considered
 * and rejected: it would promise a send that silently never happens if the tab
 * is closed.
 *
 * To turn it on: give the run endpoint its send-on-finish parameter, add the
 * argument to `campaignService.run`, then swap the tooltip-wrapped button below
 * for a live one calling it. Deliberately not left as a feature flag with a dead
 * enabled branch, because flipping the flag alone would ship a button that only
 * prepares while telling the user it sends.
 */

/** One step of preparation, ticked once it is behind us. */
function PrepareStep({
  label,
  done,
  active,
}: {
  label: string
  done: boolean
  active: boolean
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {done ? (
        <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
      ) : active ? (
        <Loader2
          className="size-4 shrink-0 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      ) : (
        <span
          className="size-4 shrink-0 rounded-full border border-dashed"
          aria-hidden="true"
        />
      )}
      <span className={done || active ? undefined : "text-muted-foreground"}>
        {label}
      </span>
      {/* The icon carries the state visually; this carries it to a screen
          reader without repeating the label. */}
      <span className="sr-only">
        {done ? "done" : active ? "in progress" : "not started"}
      </span>
    </li>
  )
}

/**
 * The campaign's launch surface: whichever of the four launch states the
 * campaign is in, as one panel under the dashboard heading.
 *
 * Two deliberate presses, and the user chooses which pair they want. "Send to
 * Outbox" prepares and stops, so every email can be read and edited first, which
 * is the safety net onboarding explains. "Run campaign" is the same preparation
 * carrying straight on into sending for people who no longer want the review
 * step. Once sending has started there is nothing left to press: a campaign
 * completes itself when every prospect has finished their sequence.
 */
export function CampaignLaunchActions({
  campaign,
  refetch,
}: {
  campaign: Campaign
  refetch: () => void
}) {
  const [busy, setBusy] = useState(false)

  const prepare = async () => {
    setBusy(true)
    try {
      await campaignService.run(campaign.id)
      toast.success(
        "Preparing your campaign. Nothing sends until you start it.",
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

  // Setup unfinished: the wizard is the only thing to do, and the campaigns
  // list already routes back into it.
  if (!campaign.setup_completed) return null

  if (campaign.status === "draft") {
    return (
      <div className="rounded-lg border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Button onClick={prepare} disabled={busy} className="w-full">
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MailCheck className="size-4" />
              )}
              Send to Outbox
            </Button>
            <p className="text-xs text-muted-foreground">
              Finds work email addresses and writes every prospect's emails into
              the Outbox, so you can read and edit them. Nothing sends until you
              press Start sending.
            </p>
          </div>

          <div className="space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                {/* aria-disabled rather than disabled: a disabled button leaves
                    the tab order, which would put the only explanation of why
                    it cannot be pressed out of reach of the keyboard. */}
                <Button
                  variant="outline"
                  aria-disabled="true"
                  onClick={(e) => e.preventDefault()}
                  className="w-full cursor-not-allowed opacity-60"
                >
                  <Play className="size-4" />
                  Run campaign
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Sending the moment preparation finishes needs backend support
                that is not live yet. Send to Outbox prepares the campaign
                today, and Start sending is one press from there.
              </TooltipContent>
            </Tooltip>
            <p className="text-xs text-muted-foreground">
              Writes the same emails and starts sending them as soon as they are
              ready. There is no review step.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (campaign.status === "enrichment_failed") {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            {campaign.enrichment_error ??
              "Something went wrong finding contact details."}{" "}
            Trying again starts preparation from the beginning.
          </p>
        </div>
        <Button onClick={prepare} disabled={busy}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          Try again
        </Button>
      </div>
    )
  }

  if (campaign.status === "preparing") {
    const stage = preparingStage(campaign)
    const composing = stage === "composing"
    return (
      <div className="space-y-3 rounded-lg border p-4">
        {/* No heading: the dashboard line directly above already says the
            campaign is preparing, and the spinner sits with it. */}
        {/* Two named stages rather than a bar: nothing counts how many of the
            prospects are written, so any percentage would be invented. */}
        <ul className="space-y-1.5 pl-1">
          <PrepareStep
            label="Finding work email addresses"
            done={campaign.enrichment_complete || composing}
            active={!campaign.enrichment_complete && !composing}
          />
          <PrepareStep
            label="Composing each prospect's emails"
            done={false}
            active={composing}
          />
        </ul>
        <p className="text-xs text-muted-foreground">
          A long prospect list can take a few minutes. This carries on if you
          leave the page.
          {CAMPAIGN_READY_NOTIFICATIONS &&
            " We will let you know when it is ready to review."}
        </p>
      </div>
    )
  }

  if (campaign.status === "ready_to_send") {
    return (
      <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Your campaign is ready to review.
          </p>
          <p className="text-sm text-muted-foreground">
            Every reachable prospect has their emails written. Read them in the
            Outbox and change anything you want, then start sending. Nothing
            leaves until you do.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link to={`/campaigns/${campaign.id}/emails`}>
              <MailCheck className="size-4" />
              Review in the Outbox
            </Link>
          </Button>
          <Button variant="outline" onClick={startSending} disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Start sending
          </Button>
        </div>
      </div>
    )
  }

  return null
}
