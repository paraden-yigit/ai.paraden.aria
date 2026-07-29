import { useCallback, useRef, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Mail,
  Pencil,
  Undo2,
} from "lucide-react"

import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmailBody } from "@/components/EmailBody"
import { EmailBodyEditor } from "@/components/EmailBodyEditor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/format"
import type { Campaign } from "@/types/campaign"
import type {
  CampaignContactEmail,
  SavedCampaignEmail,
} from "@/types/campaign-email"
import type { SendRecord } from "@/types/campaign-sending"

/**
 * What this renders: a saved campaign email, optionally carrying the extra
 * per-prospect fields the Outbox needs to offer editing. The campaign dashboard
 * passes the plain shape, so those are all optional.
 */
export type SequenceEmail = SavedCampaignEmail &
  Partial<
    Pick<
      CampaignContactEmail,
      "raw_body" | "edited_at" | "edited_by" | "can_revert" | "editable"
    >
  >

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
  onSave,
  onRevert,
}: {
  campaign: Campaign
  emails: SequenceEmail[]
  sends?: SendRecord[]
  /**
   * Start with every email closed rather than the first one open.
   *
   * The Outbox tab is a reading surface, so opening the first is a helpful
   * head start. The campaign dashboard is a summary, where the same head start
   * costs a screen of height for something nobody came to read.
   */
  startCollapsed?: boolean
  /**
   * When given, an email that is still a draft can be rewritten in place. The
   * caller owns the API call and is expected to throw on failure, which is what
   * keeps the editor open with the user's words still in it.
   */
  onSave?: (
    email: SequenceEmail,
    next: { subject: string | null; body: string },
  ) => Promise<void>
  /** When given, an edited email can be put back to the one Paraden wrote. */
  onRevert?: (email: SequenceEmail) => Promise<void>
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
      {ordered.map((email, index) => (
        <SequenceStep
          key={email.id}
          email={email}
          index={index}
          label={labels[index]}
          send={sendByStep.get(email.step_index)}
          isOpen={!!open[email.id]}
          onToggle={() =>
            setOpen((prev) => ({ ...prev, [email.id]: !prev[email.id] }))
          }
          onSave={onSave}
          onRevert={onRevert}
        />
      ))}
    </ol>
  )
}

/** One step of the sequence: its framing, subject, body, and — where the caller
 * allows it — an editor and a way back to the email Paraden wrote. */
function SequenceStep({
  email,
  index,
  label,
  send,
  isOpen,
  onToggle,
  onSave,
  onRevert,
}: {
  email: SequenceEmail
  index: number
  label: string
  send?: SendRecord
  isOpen: boolean
  onToggle: () => void
  onSave?: (
    email: SequenceEmail,
    next: { subject: string | null; body: string },
  ) => Promise<void>
  onRevert?: (email: SequenceEmail) => Promise<void>
}) {
  const meta = STEP_META[email.step_kind] ?? {
    title: `Email ${index + 1}`,
    blurb: "",
  }
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [subject, setSubject] = useState(email.subject ?? "")
  const readBody = useRef<() => string>(() => "")
  const getHtml = useCallback((read: () => string) => {
    readBody.current = read
  }, [])

  const [confirmingRevert, setConfirmingRevert] = useState(false)
  const [reverting, setReverting] = useState(false)

  // Editing is offered only where the caller supports it AND the API says this
  // email is still a draft — a sent step, or one being composed, is read-only.
  const canEdit = onSave != null && email.editable !== false
  // Reverting is an edit too, so it needs the same draft state on top of there
  // being an original to go back to.
  const canRevert = onRevert != null && canEdit && email.can_revert === true

  function startEditing() {
    setSubject(email.subject ?? "")
    setSaveError(null)
    setEditing(true)
    if (!isOpen) onToggle()
  }

  async function save() {
    if (!onSave) return
    const body = readBody.current().trim()
    if (!body) {
      setSaveError("An email needs a body.")
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(email, { subject: subject.trim() || null, body })
      setEditing(false)
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save this email.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function revert() {
    if (!onRevert) return
    setReverting(true)
    try {
      await onRevert(email)
      setConfirmingRevert(false)
    } finally {
      // The caller reports the failure; leaving the dialog open would just hide
      // the toast behind it.
      setReverting(false)
      setConfirmingRevert(false)
    }
  }

  return (
    <li className="rounded-lg border">
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
              {email.edited_at && (
                <Badge variant="outline">
                  Edited{email.edited_by ? ` by ${email.edited_by}` : ""}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{meta.blurb}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-sm text-muted-foreground">{label}</span>
          {send && <SendOutcome send={send} />}
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
          <div className="flex shrink-0 items-center gap-1">
            {canRevert && !editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingRevert(true)}
                disabled={reverting}
              >
                {reverting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Undo2 className="size-4" />
                )}
                Revert to original
              </Button>
            )}
            {canEdit && !editing && (
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
            {!editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                aria-expanded={isOpen}
              >
                {isOpen ? "Hide email" : "Read email"}
                {isOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor={`subject-${email.id}`}
                className="text-xs font-medium text-muted-foreground"
              >
                Subject
              </label>
              <Input
                id={`subject-${email.id}`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Leave empty to reply in the same thread"
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Email
              </span>
              <EmailBodyEditor
                initialHtml={email.raw_body ?? email.body}
                getHtml={getHtml}
                disabled={saving}
                ariaLabel={`Body of email ${index + 1}`}
              />
              <p className="text-xs text-muted-foreground">
                Write the message only. Your sign-off and signature are added
                automatically when it is sent.
              </p>
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  setSaveError(null)
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <EmailBody
            body={email.body}
            className={cn("text-muted-foreground", isOpen ? "mt-3" : "hidden")}
          />
        )}

      </div>

      <ConfirmDialog
        open={confirmingRevert}
        onOpenChange={(open) => {
          if (!open && !reverting) setConfirmingRevert(false)
        }}
        title="Go back to the original email?"
        description="Your changes to this email are replaced by the version Paraden wrote, and that is what will be sent. You would have to write them again."
        confirmLabel="Revert to original"
        destructive
        loading={reverting}
        onConfirm={revert}
      />
    </li>
  )
}
