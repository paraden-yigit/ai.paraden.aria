/**
 * SAMPLE DATA (design preview): every message below is invented. The inbox
 * exists so the shape can be agreed before the backend is wired; nothing here
 * came from a mailbox.
 *
 * There is no user-scoped endpoint for any of the three folders yet. The full
 * history lives behind `GET /api/admin/email-history`, which aria cannot reach
 * because it holds a user session, not an admin one. Yigit is building the
 * user-facing routes; when they land, replace `sampleThreads` with a service
 * call and delete the banner flag in `SampleDataBanner`.
 *
 * The types below deliberately mirror the schemas the API already commits to,
 * so wiring is a change of data source rather than a re-type:
 *   sent/received -> app/schemas/email_history.py  (EmailHistoryItem, ReplyRead)
 *   outbox        -> app/schemas/sending.py        (ContactSendingStatus)
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

export const SAMPLE_MAILBOXES = [
  "rron@goparaden.com",
  "rron.imami@paraden-outreach.com",
]

export const SAMPLE_MESSAGES: InboxMessage[] = [
  {
    id: 1,
    folder: "received",
    mailbox: "rron@goparaden.com",
    contact: {
      name: "Anika Patel",
      email: "a.patel@northwind-industrial.com",
      company: "Northwind Industrial",
      jobTitle: "VP Sales",
    },
    campaign: "Manufacturing Q3",
    subject: "Re: Your switch to direct distribution",
    receivedAt: "2026-07-28T09:12:00Z",
    category: "success",
    isAutomated: false,
    body: "<p>Hi Rron,</p><p>Good timing. We did move three regions to direct in February and the sales side has felt it since.</p><p>Thursday afternoon works if you are still free. Send something over.</p><p>Anika</p>",
  },
  {
    id: 2,
    folder: "received",
    mailbox: "rron@goparaden.com",
    contact: {
      name: "Marc Vidal",
      email: "marc@helioslabs.io",
      company: "Helios Labs",
      jobTitle: "Head of Revenue",
    },
    campaign: "Manufacturing Q3",
    subject: "Re: Scaling outbound without scaling headcount",
    receivedAt: "2026-07-27T16:40:00Z",
    category: "other",
    isAutomated: false,
    body: "<p>Not me you want, but worth talking to Dani who runs our SDR team. Copying her in.</p>",
  },
  {
    id: 3,
    folder: "received",
    mailbox: "rron.imami@paraden-outreach.com",
    contact: {
      name: "Priya Shah",
      email: "p.shah@atlasfreight.com",
      company: "Atlas Freight",
      jobTitle: "Sales Director",
    },
    campaign: "Nordics expansion",
    subject: "Automatic reply: Out of office",
    receivedAt: "2026-07-27T08:02:00Z",
    category: "automated",
    isAutomated: true,
    body: "<p>I am out of the office until 4 August with limited access to email.</p>",
  },
  {
    id: 4,
    folder: "received",
    mailbox: "rron@goparaden.com",
    contact: {
      name: "Tom Vance",
      email: "t.vance@brightline.co.uk",
      company: "Brightline",
      jobTitle: "Commercial Director",
    },
    campaign: "Manufacturing Q3",
    subject: "Re: Brightline's move into aftermarket parts",
    receivedAt: "2026-07-26T11:25:00Z",
    category: "opt_out",
    isAutomated: false,
    body: "<p>Please take me off this list.</p>",
  },
  {
    id: 5,
    folder: "sent",
    mailbox: "rron@goparaden.com",
    contact: {
      name: "Anika Patel",
      email: "a.patel@northwind-industrial.com",
      company: "Northwind Industrial",
      jobTitle: "VP Sales",
    },
    campaign: "Manufacturing Q3",
    subject: "Your switch to direct distribution",
    step: { index: 1, total: 3, kind: "opener" },
    sentAt: "2026-07-24T09:31:00Z",
    tracked: true,
    firstOpenedAt: "2026-07-24T14:02:00Z",
    openCount: 3,
    body: "<p>Hi Anika,</p><p>Saw the move to direct distribution across the three regions in February, and the point you made about channel strategy at the conference in March.</p><p>That kind of shift usually puts the sales layer under real pressure for the first six months, while the new partner data is still being cleaned up.</p><p>Worth twenty minutes to compare notes?</p>",
  },
  {
    id: 6,
    folder: "sent",
    mailbox: "rron@goparaden.com",
    contact: {
      name: "Marc Vidal",
      email: "marc@helioslabs.io",
      company: "Helios Labs",
      jobTitle: "Head of Revenue",
    },
    campaign: "Manufacturing Q3",
    subject: "Scaling outbound without scaling headcount",
    step: { index: 1, total: 3, kind: "opener" },
    sentAt: "2026-07-24T09:47:00Z",
    tracked: true,
    firstOpenedAt: null,
    openCount: 0,
    body: "<p>Hi Marc,</p><p>Congratulations on the Series B. Your post last month about scaling outbound without scaling headcount stuck with me.</p><p>Most teams hit that wall around forty reps. Happy to share what has worked for the ones that got through it.</p>",
  },
  {
    id: 7,
    folder: "sent",
    mailbox: "rron.imami@paraden-outreach.com",
    contact: {
      name: "Priya Shah",
      email: "p.shah@atlasfreight.com",
      company: "Atlas Freight",
      jobTitle: "Sales Director",
    },
    campaign: "Nordics expansion",
    subject: "Atlas's expansion into the Nordics",
    step: { index: 2, total: 3, kind: "advancer" },
    sentAt: "2026-07-23T10:15:00Z",
    // Deliberately untracked, so the UI has to prove it does not report this
    // as "not opened".
    tracked: false,
    firstOpenedAt: null,
    openCount: 0,
    body: "<p>Hi Priya,</p><p>Following up on the Nordic expansion. Teams opening a new region usually underestimate how fast the playbook needs to localise.</p><p>Worth a short call?</p>",
  },
  {
    id: 8,
    folder: "outbox",
    mailbox: "rron@goparaden.com",
    contact: {
      name: "Dora Hein",
      email: "d.hein@vantia.de",
      company: "Vantia",
      jobTitle: "Head of Sales",
    },
    campaign: "Manufacturing Q3",
    subject: "Vantia's new production line",
    step: { index: 1, total: 3, kind: "opener" },
    scheduledFor: "2026-07-29T09:00:00Z",
    body: "<p>Hi Dora,</p><p>Saw the announcement about the second production line in Hamburg.</p><p>Worth twenty minutes?</p>",
  },
  {
    id: 9,
    folder: "outbox",
    mailbox: "rron@goparaden.com",
    contact: {
      name: "Anika Patel",
      email: "a.patel@northwind-industrial.com",
      company: "Northwind Industrial",
      jobTitle: "VP Sales",
    },
    campaign: "Manufacturing Q3",
    subject: "Replies in the same thread, no new subject",
    step: { index: 2, total: 3, kind: "advancer" },
    scheduledFor: "2026-07-29T11:30:00Z",
    body: "<p>Hi Anika,</p><p>One more thought on the partner data question.</p>",
  },
  {
    id: 10,
    folder: "outbox",
    mailbox: "rron.imami@paraden-outreach.com",
    contact: {
      name: "Lars Sundqvist",
      email: "l.sundqvist@nordkust.se",
      company: "Nordkust Logistik",
      jobTitle: "Commercial Lead",
    },
    campaign: "Nordics expansion",
    subject: "Nordkust's Gothenburg hub",
    step: { index: 1, total: 3, kind: "opener" },
    scheduledFor: "2026-07-30T09:00:00Z",
    body: "<p>Hi Lars,</p><p>Noticed the Gothenburg hub opening in June.</p><p>Worth a short call?</p>",
  },
]

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
