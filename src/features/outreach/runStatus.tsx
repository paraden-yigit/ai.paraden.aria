import { Badge } from "@/components/ui/badge"
import type { OutreachRunStatus } from "@/types/outreach"

/**
 * What each status means, in the reader's terms rather than the model's.
 *
 * One copy for the whole app: the list, the dashboard header and the spotlight
 * all name the same seven states, and three copies of this map is three places
 * for "paused" to end up called something else.
 */
export const RUN_STATUS_LABELS: Record<OutreachRunStatus, string> = {
  draft: "Draft",
  composing: "Writing",
  ready: "Ready to launch",
  running: "Running",
  paused: "Paused",
  launched: "Launched",
  failed: "Needs attention",
}

/** A campaign's state, styled by how much attention it wants. */
export function RunStatusBadge({ status }: { status: OutreachRunStatus }) {
  if (status === "running" || status === "launched")
    return <Badge>{RUN_STATUS_LABELS[status]}</Badge>
  if (status === "failed")
    return <Badge variant="destructive">{RUN_STATUS_LABELS[status]}</Badge>
  return <Badge variant="outline">{RUN_STATUS_LABELS[status]}</Badge>
}
