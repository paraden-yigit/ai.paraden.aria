/**
 * What a message is, in the three folders the inbox shows.
 *
 * **Outbox** is real — `/api/outbox`, this sender's own queued mail. Sent and
 * received have no user-scoped endpoint yet: the history lives behind
 * `GET /api/admin/email-history`, which aria cannot reach holding a user
 * session. They render empty until those routes land, which is the honest
 * state — an invented inbox was worse than an empty one, because it could not
 * be told apart from a real one.
 *
 * The types mirror the schemas the API already commits to, so wiring the other
 * two folders is a change of data source rather than a re-type:
 *   sent/received -> app/schemas/email_history.py  (EmailHistoryItem, ReplyRead)
 *   outbox        -> app/schemas/outbox.py         (OutboxItem)
 */

export type Folder = "received" | "sent" | "outbox"

/** Mirrors ReplyRead.category. `automated` never counts as a real reply. */
export type ReplyCategory =
  | "success"
  | "fail"
  | "opt_out"
  | "other"
  | "automated"

export interface InboxMessage {
  id: number
  folder: Folder
  /** The mailbox this went out from, or arrived at. */
  mailbox: string
  /** The prospect at the other end. */
  contact: { name: string; email: string; company: string; jobTitle: string }
  campaign: string
  subject: string
  body: string
  /** Which step of the sequence, for sent and queued messages. */
  step?: { index: number; total: number; kind: "opener" | "advancer" | "closer" }

  /* Sent-only. Mirrors EmailHistoryItem. */
  sentAt?: string
  /** False when the message carries no tracking pixel. Must never be rendered
   * as "not opened": untracked and unopened are different facts. */
  tracked?: boolean
  firstOpenedAt?: string | null
  openCount?: number

  /* Received-only. Mirrors ReplyRead. */
  receivedAt?: string
  category?: ReplyCategory
  isAutomated?: boolean

  /* Outbox-only. Mirrors ContactSendingStatus. */
  scheduledFor?: string
}

export const FOLDERS: { key: Folder; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "sent", label: "Sent" },
  { key: "outbox", label: "Outbox" },
]

/** Category labels. `automated` is styled and worded so it never reads as a
 * person replying, which is also how the backend counts it. */
export const CATEGORY_LABEL: Record<ReplyCategory, string> = {
  success: "Interested",
  fail: "Not interested",
  opt_out: "Opted out",
  other: "Replied",
  automated: "Auto-reply",
}
