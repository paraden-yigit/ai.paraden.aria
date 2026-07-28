/**
 * Helpers for displaying a generated email body.
 *
 * Bodies are HTML fragments (written by the email agent, with the sender's HTML
 * signature appended by the API) so a preview shows what the prospect will
 * actually receive. Emails generated before that change are plain text, hence
 * `looksLikeEmailHtml`.
 */

// The tags a generated body or a pasted signature is made of. An allowlist on
// purpose: plain-text copy like "costs < 5%" must not read as markup.
const HTML_TAG =
  /<\s*\/?\s*(?:p|br|div|span|a|img|table|tbody|tr|td|ul|ol|li|strong|b|em|i|h[1-6]|blockquote|font|hr)\b[^>]*>/i

/** True when the body already carries HTML markup and should be rendered as HTML. */
export function looksLikeEmailHtml(body: string | null | undefined): boolean {
  return HTML_TAG.test(body ?? "")
}

// Elements that never belong in a rendered email body, dropped with their content.
const FORBIDDEN_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "link",
  "meta",
  "base",
]

/**
 * Strip anything executable from an email body before it is rendered.
 *
 * The content is first-party (our agent plus the sender's own signature), but it
 * is written from crawled and enriched third-party text, so it is not trusted
 * blindly: scripts, embedded frames, event handlers and `javascript:` URLs go.
 * Everything else — layout tags, inline styles, images, links — is kept so the
 * signature renders as designed.
 */
export function sanitizeEmailHtml(body: string): string {
  return sanitizedBody(body).innerHTML
}

/**
 * The body as readable plain text — what a word count or an excerpt should be
 * measured on, since the markup itself is not copy.
 */
export function emailPlainText(body: string | null | undefined): string {
  const text = (body ?? "").trim()
  if (!looksLikeEmailHtml(text)) return text
  return (sanitizedBody(text).textContent ?? "").trim()
}

function sanitizedBody(body: string): HTMLElement {
  const doc = new DOMParser().parseFromString(body, "text/html")
  doc.body.querySelectorAll(FORBIDDEN_TAGS.join(",")).forEach((el) => el.remove())
  doc.body.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name)
      } else if (
        (name === "href" || name === "src" || name === "srcset") &&
        (value.startsWith("javascript:") || value.startsWith("data:text/html"))
      ) {
        el.removeAttribute(attr.name)
      }
    }
  })
  return doc.body
}
