/**
 * The outbound sending queue. Once a campaign's emails are generated, every
 * reachable prospect becomes an "enrollment" that advances one step at a time;
 * a dispatcher sends what the per-mailbox pacing and daily caps allow.
 *
 * Mirrors the API's app/schemas/sending.py.
 */

/** Where a prospect sits in the queue. */
export type SendingStatus =
  | "active"
  | "completed"
  | "paused"
  | "failed"
  | "replied"

/** Dispatch priority — committed sequences finish before new ones start. */
export const TIER_CLOSER = 0
export const TIER_ADVANCER = 1
export const TIER_OPENER = 2

/** One prospect's place in the sending queue. */
export interface ContactSendingStatus {
  status: SendingStatus
  /** Steps already sent; the one in flight is `current_step + 1`. */
  current_step: number
  steps_total: number
  priority_tier: number
  /** Earliest moment the next step may go out — a floor, not a promise. */
  next_eligible_at: string | null
  last_sent_at: string | null
  /** The address this prospect's thread is pinned to (null before the opener). */
  mailbox_email: string | null
  failure_reason: string | null
}

/** One send attempt against one step. */
export interface SendRecord {
  step_index: number
  step_kind: string
  /** "sending" (in flight), "sent", or "failed". */
  status: string
  sender_email: string
  recipient_email: string
  subject: string | null
  attempted_at: string
  sent_at: string | null
  error: string | null
  error_kind: string | null
}

/** Response of GET /api/campaigns/{id}/sending/contacts/{contactId}. */
export interface ContactSendingDetail {
  sending: ContactSendingStatus | null
  sends: SendRecord[]
}

/** One of the owner's mailboxes and its share of today's sending. */
export interface MailboxLoad {
  mailbox_id: number
  email: string | null
  sent_today: number
  daily_cap: number
  send_offset_minutes: number | null
  paused: boolean
}

/** The platform sending window, echoed so the UI can explain the pacing. */
export interface SendingWindow {
  start_time: string
  end_time: string
  timezone: string
  daily_email_count: number
}

/** Response of GET /api/campaigns/{id}/sending/summary. */
export interface CampaignSendingSummary {
  enrolled: number
  active: number
  completed: number
  paused: number
  failed: number
  sent_total: number
  sent_today: number
  next_send_at: string | null
  /** Why nothing is going out, when nothing is. Null when all is well. */
  blocked_reason: string | null
  /** False while the platform dispatcher is switched off. */
  sending_enabled: boolean
  window: SendingWindow
  mailboxes: MailboxLoad[]
}
