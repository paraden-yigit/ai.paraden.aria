import type { OutboxItem } from "@/types/outbox"
import type { InboxMessage } from "./messages"

/**
 * A queued send, as the mail client renders it.
 *
 * The Outbox folder is the one with a backend: these come from `/api/outbox`,
 * while sent and received wait for user-scoped routes and render empty until
 * they land. The message shape was written to mirror what the API returns, so
 * this is a rename rather than a translation.
 *
 * `scheduledFor` is the earliest the message may go, not the minute it will —
 * the per-mailbox pacing still decides that — which is why the list labels it
 * "due".
 */
export function toInboxMessage(item: OutboxItem): InboxMessage {
  return {
    id: item.id,
    folder: "outbox",
    mailbox: item.mailbox ?? "Not yet assigned",
    contact: {
      name: item.contact_name ?? item.contact_email ?? "Unknown",
      email: item.contact_email ?? "",
      company: item.contact_company ?? "",
      jobTitle: item.contact_title ?? "",
    },
    campaign: item.campaign_name ?? "",
    subject: item.subject ?? "",
    body: item.body ?? "",
    step: {
      index: item.step_index,
      total: item.steps_total,
      kind: (item.step_kind as "opener" | "advancer" | "closer") ?? "opener",
    },
    scheduledFor: item.scheduled_for,
  }
}
