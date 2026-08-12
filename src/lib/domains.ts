/**
 * Reading company domains out of whatever a user actually pastes or uploads.
 *
 * A column of "domains" in the wild is a column of URLs: `https://www.acme.com`,
 * `www.acme.com/careers`, `acme.com.` and `acme.com` are all the same company,
 * and all four have to come out as `acme.com`. Anything that is not a domain —
 * a header cell, a company name, a stray note — is not a value to guess at, so
 * it is reported as skipped rather than corrected.
 */

// A hostname: dot-separated labels, letters/digits/hyphens (never leading or
// trailing), ending in an alphabetic TLD of at least two characters. Unicode
// letters are allowed, so "café.fr" survives alongside its punycode form.
const HOSTNAME =
  /^(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+[\p{L}]{2,}$/u

const MAX_LENGTH = 253

/**
 * The bare domain in `raw`, or null if there isn't one.
 *
 * Strips a scheme, a `www.` prefix, any path/query/fragment, a port and a
 * trailing dot, then checks what is left is actually a hostname.
 */
export function normaliseDomain(raw: string): string | null {
  let value = raw.trim().toLowerCase()
  if (!value) return null

  // Spreadsheet exports love wrapping cells in quotes.
  value = value.replace(/^["'<]+|["'>]+$/g, "")
  // An address is a person, not a company — refusing beats silently taking the
  // half after the @, which may be a mailbox provider rather than the company.
  if (value.includes("@")) return null

  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
  value = value.split(/[/?#]/)[0]
  value = value.replace(/:\d+$/, "")
  value = value.replace(/^www\./, "")
  value = value.replace(/\.+$/, "")

  if (!value || value.length > MAX_LENGTH) return null
  return HOSTNAME.test(value) ? value : null
}

export interface ExtractedDomains {
  /** Valid domains, deduped, in the order they appeared. */
  domains: string[]
  /** Values that were not domains, kept so the user can be told how many. */
  skipped: string[]
  /** Domains that were already on the list or repeated in the file. */
  duplicates: number
}

/** Pull the domains out of a column of values (or of pasted lines). */
export function extractDomains(
  values: string[],
  existing: string[] = [],
): ExtractedDomains {
  const seen = new Set(existing)
  const domains: string[] = []
  const skipped: string[] = []
  let duplicates = 0

  for (const value of values) {
    const domain = normaliseDomain(value)
    if (!domain) {
      if (value.trim()) skipped.push(value.trim())
      continue
    }
    if (seen.has(domain)) {
      duplicates += 1
      continue
    }
    seen.add(domain)
    domains.push(domain)
  }

  return { domains, skipped, duplicates }
}

/** The most companies one campaign may be aimed at. Mirrored by the API. */
export const MAX_COMPANIES = 500

/**
 * Why a batch of domains cannot be added, or null when it can.
 *
 * All or nothing: a list that is too long is refused whole rather than trimmed
 * to fit. Quietly keeping the first 500 of somebody's 800 would mean a campaign
 * aimed at a list nobody chose, and the 300 that were dropped would never be
 * mentioned again.
 *
 * Counted in companies rather than in rows — a file padded with headers and
 * blank lines is as long as the domains that come out of it, not as long as it
 * looks.
 */
export function companyLimitError(
  existing: number,
  incoming: number,
): string | null {
  const total = existing + incoming
  if (total <= MAX_COMPANIES) return null
  if (existing === 0) {
    return `That is ${total} companies, and a campaign can hold ${MAX_COMPANIES}. Nothing was added — split the list or shorten it.`
  }
  return `That would make ${total} companies, and a campaign can hold ${MAX_COMPANIES}. ${existing} ${existing === 1 ? "is" : "are"} already on the list, so nothing was added.`
}

/** Split pasted text into candidate values: one per line, or comma-separated. */
export function splitPasted(text: string): string[] {
  return text
    .split(/[\n\r,;\t]+/)
    .map((line) => line.trim())
    .filter(Boolean)
}
