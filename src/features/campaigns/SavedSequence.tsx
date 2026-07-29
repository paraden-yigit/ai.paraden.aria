import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Mail,
} from "lucide-react"

import { EmailBody } from "@/components/EmailBody"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/format"
import type { Campaign } from "@/types/campaign"
import type { SavedCampaignEmail } from "@/types/campaign-email"
import type { SendRecord } from "@/types/campaign-sending"

// Plain-language framing for each step kind, so non-technical users know what
// each email in the sequence is actually for.
const STEP_META: Record<string, { title: string; blurb: string }> = {
  opener: {
    title: "The opener",
    blurb: "Introduces you and why you are relevant to this prospect.",
  },
  advancer: {
    title: "The follow up",
    blurb: "Returns with a fresh angle and a soft ask.",
  },
  closer: {
    title: "The closer",
    blurb: "Politely closes the loop and leaves the door open.",
  },
}

/** "Day 1", then cumulative "+N working days" offsets from the sequence gaps. */
function dayLabels(campaign: Campaign, count: number): string[] {
  const gaps = [campaign.sequence_advancer_gap, campaign.sequence_closer_gap]
  const labels: string[] = []
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      labels.push("Day 1")
    } else {
      const gap = gaps[i - 1]
      labels.push(gap != null ? `${gap} working days later` : "Later")
    }
  }
  return labels
}

/** What actually happened to a step, when we have a send record for it. */
function SendOutcome({ send }: { send: SendRecord }) {
  if (send.status === "sent") {
    return (
      <span className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
          Sent {formatDateTime(send.sent_at)} from {send.sender_email}
        </span>
        {/* Shown only when the pixel actually loaded. There is deliberately no
            "not opened" state: a recipient who blocks images reads the email and
            never reaches us, so silence is not evidence of anything. */}
        {send.first_opened_at && (
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5 shrink-0 text-sky-600" />
            Opened {formatDateTime(send.first_opened_at)}
          </span>
        )}
      </span>
    )
  }
  if (send.status === "sending") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
        Sending from {send.sender_email}…
      </span>
    )
  }
  return (
    <span className="flex items-start gap-1.5 text-xs text-destructive">
      <AlertCircle className="mt-px size-3.5 shrink-0" />
      {send.error ?? "This email could not be sent."}
    </span>
  )
}

/**
 * The campaign's saved outreach emails as a readable timeline: one card per
 * step with its timing, the angle the user picked, subject, and an expandable
 * body. The first email starts expanded so the section never reads as empty.
 *
 * ``sends`` is the delivery record for one prospect — pass it and each step also
 * shows whether it actually went out. Omitted on the campaign dashboard, where
 * the sequence is shown as a template rather than as one person's thread.
 */
export function SavedSequence({
  campaign,
  emails,
  sends,
  startCollapsed = false,
}: {
  campaign: Campaign
  emails: SavedCampaignEmail[]
  sends?: SendRecord[]
  /**
   * Start with every email closed rather than the first one open.
   *
   * The Emails tab is a reading surface, so opening the first is a helpful
   * head start. The campaign dashboard is a summary, where the same head start
   * costs a screen of height for something nobody came to read.
   */
  startCollapsed?: boolean
}) {
  const ordered = [...emails].sort((a, b) => a.step_index - b.step_index)
  const [open, setOpen] = useState<Record<number, boolean>>(() =>
    ordered.length > 0 && !startCollapsed ? { [ordered[0].id]: true } : {},
  )
  const labels = dayLabels(campaign, ordered.length)
  // Latest attempt per step: a retried step has more than one record, and the
  // most recent is the one that describes where it actually stands.
  const sendByStep = new Map<number, SendRecord>()
  for (const send of sends ?? []) sendByStep.set(send.step_index, send)

  return (
    <ol className="space-y-3">
      {ordered.map((email, index) => {
        const meta = STEP_META[email.step_kind] ?? {
          title: `Email ${index + 1}`,
          blurb: "",
        }
        const isOpen = !!open[email.id]
        return (
          <li key={email.id} className="rounded-lg border">
            <div className="flex flex-wrap items-start justify-between gap-2 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      Email {index + 1}: {meta.title.toLowerCase()}
                    </span>
                    {email.approach && (
                      <Badge variant="secondary">{email.approach}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{meta.blurb}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <span className="text-sm text-muted-foreground">
                  {labels[index]}
                </span>
                {sendByStep.has(email.step_index) && (
                  <SendOutcome send={sendByStep.get(email.step_index)!} />
                )}
              </div>
            </div>

            <div className="border-t px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-2 text-sm">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">
                    {email.subject?.trim()
                      ? email.subject
                      : "Replies in the same thread, no new subject"}
                  </span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setOpen((prev) => ({ ...prev, [email.id]: !isOpen }))
                  }
                  aria-expanded={isOpen}
                >
                  {isOpen ? "Hide email" : "Read email"}
                  {isOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </div>
              <EmailBody
                body={email.body}
                className={cn(
                  "text-muted-foreground",
                  isOpen ? "mt-3" : "hidden",
                )}
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
