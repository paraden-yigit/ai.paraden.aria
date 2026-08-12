/**
 * The caller's own queued mail: written, timed, and not yet sent.
 *
 * Shaped like a message rather than like the enrollment behind it, because the
 * page that renders it is a mail client. Mirrors `app/schemas/outbox.py`.
 */
export interface OutboxItem {
  id: number
  campaign_id: number
  campaign_name: string | null
  /** The address it goes out from. Known ahead because the plan sets one aside. */
  mailbox: string | null

  contact_name: string | null
  contact_email: string | null
  contact_company: string | null
  contact_title: string | null

  subject: string | null
  /** The stored copy plus the sender's sign-off — the message that arrives. */
  body: string | null

  step_index: number
  steps_total: number
  step_kind: string | null

  /** The earliest it may go. A floor, not a promise: read it as "due at". */
  scheduled_for: string
  /** The far end of the recipient's own local morning, when planned in theirs. */
  send_not_after: string | null

  status: string
  /** Why it is not going anywhere yet, when it is not. */
  blocked_reason: string | null
}
