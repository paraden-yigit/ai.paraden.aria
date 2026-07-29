import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatDateTime } from "@/lib/format"
import type { ContactSendingStatus } from "@/types/campaign-sending"

type BadgeVariant = "default" | "secondary" | "outline" | "destructive"

/**
 * A prospect's sending state as a short label plus the detail on hover.
 *
 * The label answers "where are they up to"; the tooltip answers "and when does
 * the next one go out", which is the question a paced queue invites — from the
 * outside, waiting looks exactly like broken.
 */
export function SendingStatusBadge({
  sending,
}: {
  sending: ContactSendingStatus | null | undefined
}) {
  if (!sending) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  const { status, current_step, steps_total } = sending
  const sent = Math.min(current_step, steps_total)

  let label: string
  let variant: BadgeVariant
  switch (status) {
    case "completed":
      label = "Sequence sent"
      variant = "outline"
      break
    case "paused":
      label = "Paused"
      variant = "secondary"
      break
    case "failed":
      label = "Failed"
      variant = "destructive"
      break
    case "replied":
      label = "Replied"
      variant = "default"
      break
    case "suppressed":
      // Not a failure: they asked to be left alone and we honoured it.
      label = "Opted out"
      variant = "outline"
      break
    case "excluded":
      // Also not a failure: the exclusion list is a decision, not a problem.
      label = "Excluded"
      variant = "outline"
      break
    default:
      label = sent === 0 ? "Queued" : `Step ${sent} of ${steps_total} sent`
      variant = sent === 0 ? "secondary" : "default"
  }

  const detail: string[] = []
  if (sending.last_sent_at) {
    detail.push(`Last sent ${formatDateTime(sending.last_sent_at)}`)
  }
  if (status === "active" && sending.next_eligible_at) {
    // "Eligible from", not "sends at": pacing and daily caps can push it later.
    detail.push(`Next eligible ${formatDateTime(sending.next_eligible_at)}`)
  }
  if (sending.mailbox_email) {
    detail.push(`Sending from ${sending.mailbox_email}`)
  }
  if (sending.failure_reason) {
    detail.push(sending.failure_reason)
  }

  const badge = <Badge variant={variant}>{label}</Badge>
  if (detail.length === 0) return badge

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default">{badge}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          {detail.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
