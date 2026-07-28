import { useMemo } from "react"

import { looksLikeEmailHtml, sanitizeEmailHtml } from "@/lib/email-html"
import { cn } from "@/lib/utils"

/**
 * Renders a generated email body the way the prospect will see it: HTML,
 * including the sender's signature block. A body from an older generation is
 * still plain text and is rendered with its line breaks preserved.
 */
export function EmailBody({
  body,
  className,
}: {
  body: string | null | undefined
  className?: string
}) {
  const text = (body ?? "").trim()
  const isHtml = looksLikeEmailHtml(text)
  const html = useMemo(
    () => (isHtml ? sanitizeEmailHtml(text) : ""),
    [isHtml, text],
  )

  if (!text) return null
  if (!isHtml) {
    return (
      <div className={cn("whitespace-pre-wrap text-sm", className)}>{text}</div>
    )
  }
  return (
    <div
      className={cn(
        "text-sm [overflow-wrap:anywhere]",
        // Email markup carries no classes of its own, so the few tags it does
        // use are styled here — paragraph rhythm, readable links, and images
        // (signature logos) kept inside the container.
        "[&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_a]:text-foreground [&_a]:underline",
        "[&_img]:inline-block [&_img]:h-auto [&_img]:max-w-full",
        "[&_table]:max-w-full",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
