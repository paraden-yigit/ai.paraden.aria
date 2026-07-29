import { useEffect, useRef } from "react"

import { sanitizeEmailHtml } from "@/lib/email-html"
import { cn } from "@/lib/utils"

/**
 * An editable email body, styled to match `EmailBody` so writing looks like
 * reading.
 *
 * Bodies are HTML fragments — the agent uses `<p>`, and sparingly `<a>` and
 * `<strong>`. Editing them as text would flatten a link the moment someone fixed
 * a typo elsewhere in the sentence, so this is a `contentEditable` surface: what
 * is already there survives, and typing produces markup the email pipeline
 * already understands.
 *
 * Deliberately uncontrolled. Rewriting `innerHTML` from state on every keystroke
 * would move the caret to the end of the text on each one; instead the initial
 * HTML is seeded once and the current value is read back on demand via `getHtml`.
 * The value is sanitized on the way in and on the way out — and again by the API,
 * which is the boundary that actually matters.
 */
export function EmailBodyEditor({
  initialHtml,
  getHtml,
  disabled = false,
  className,
  ariaLabel = "Email body",
}: {
  initialHtml: string | null | undefined
  /** Receives a getter for the current (sanitized) HTML, for the caller's save. */
  getHtml: (read: () => string) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Seed once per email. Keyed on `initialHtml` so switching to a different email
  // (or reverting an edit) reloads the surface, which is the only time replacing
  // the content out from under the caret is what the user asked for.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = sanitizeEmailHtml(initialHtml ?? "")
  }, [initialHtml])

  useEffect(() => {
    getHtml(() => sanitizeEmailHtml(ref.current?.innerHTML ?? ""))
  }, [getHtml])

  return (
    <div
      ref={ref}
      contentEditable={!disabled}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel}
      tabIndex={0}
      className={cn(
        "min-h-40 rounded-md border bg-background px-3 py-2 text-sm",
        "[overflow-wrap:anywhere] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        // Same tag styling as EmailBody: the copy carries no classes of its own.
        "[&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_a]:text-foreground [&_a]:underline",
        "[&_img]:inline-block [&_img]:h-auto [&_img]:max-w-full",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    />
  )
}
