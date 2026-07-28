import { FlaskConical } from "lucide-react"

/**
 * The one flag that turns the whole inbox from preview to live.
 *
 * Flip to `false` when the messages come from the API instead of
 * `sampleMessages.ts`, and this banner disappears along with the badges that
 * read from it. An inbox is the one screen where a small badge is not enough:
 * plausible fake mail on a screen someone glances at is genuinely misleading.
 */
export const INBOX_IS_SAMPLE_DATA = true

export function SampleDataBanner() {
  if (!INBOX_IS_SAMPLE_DATA) return null
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm"
    >
      <FlaskConical
        className="mt-0.5 size-4 shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <div>
        <p className="font-medium">
          Sample data. None of these messages are real.
        </p>
        <p className="text-muted-foreground">
          This is a design preview of the inbox. Real sent, received and queued
          mail appears here once the backend exposes it.
        </p>
      </div>
    </div>
  )
}
