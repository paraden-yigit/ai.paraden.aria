import { useState } from "react"
import { ChevronDown, ChevronUp, Mail } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Campaign } from "@/types/campaign"
import type { SavedCampaignEmail } from "@/types/campaign-email"

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

/**
 * The campaign's saved outreach emails as a readable timeline: one card per
 * step with its timing, the angle the user picked, subject, and an expandable
 * body. The first email starts expanded so the section never reads as empty.
 */
export function SavedSequence({
  campaign,
  emails,
}: {
  campaign: Campaign
  emails: SavedCampaignEmail[]
}) {
  const ordered = [...emails].sort((a, b) => a.step_index - b.step_index)
  const [open, setOpen] = useState<Record<number, boolean>>(() =>
    ordered.length > 0 ? { [ordered[0].id]: true } : {},
  )
  const labels = dayLabels(campaign, ordered.length)

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
              <span className="text-sm text-muted-foreground">
                {labels[index]}
              </span>
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
              <div
                className={cn(
                  "whitespace-pre-wrap text-sm text-muted-foreground",
                  isOpen ? "mt-3" : "hidden",
                )}
              >
                {email.body ?? ""}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
