import type { ParsedCsv } from "@/lib/spreadsheet"
import type { OutreachImport, OutreachProspectIn } from "@/types/outreach"

/**
 * Turning a spreadsheet into a list, without asking anyone to map columns.
 *
 * Header names are matched against known aliases rather than positions, because
 * every CRM exports the same eight fields under a different label and making the
 * user reconcile that by hand is a step nobody enjoys. Anything unrecognised is
 * ignored rather than rejected — a file with three useful columns and nine
 * irrelevant ones is a perfectly good file.
 *
 * Companies are deduplicated by domain, then by name, so twenty people at one
 * employer produce one company record and twenty links to it. That matters
 * beyond tidiness: the company's context note is read once per company when the
 * angle is chosen, so duplicates would be twenty different companies as far as
 * the research is concerned.
 */

/** Header aliases per field, lower-cased and stripped of anything but letters. */
const ALIASES: Record<string, string[]> = {
  email: ["email", "emailaddress", "workemail", "businessemail", "mail"],
  full_name: ["name", "fullname", "contactname", "person", "contact"],
  first_name: ["firstname", "givenname", "forename"],
  last_name: ["lastname", "surname", "familyname"],
  job_title: ["title", "jobtitle", "role", "position", "jobrole"],
  seniority: ["seniority", "level", "senioritylevel"],
  department: ["department", "function", "jobfunction", "team"],
  linkedin_url: ["linkedin", "linkedinurl", "linkedinprofile", "profile"],
  city: ["city", "town", "locality"],
  country: ["country"],
  company_name: ["company", "companyname", "organisation", "organization", "account", "employer"],
  company_domain: ["domain", "website", "companydomain", "url", "companywebsite", "site"],
  company_industry: ["industry", "sector", "vertical"],
  company_linkedin: ["companylinkedin", "companylinkedinurl", "organisationlinkedin"],
  context: ["notes", "note", "context", "comment", "comments", "background"],
}

/** Reduce a header to letters only, so "Work Email " and "work_email" agree. */
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z]/g, "")
}

/** `{field: columnIndex}` for every field the file appears to carry. */
export function matchColumns(headers: string[]): Record<string, number> {
  const matched: Record<string, number> = {}
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header)
    if (!normalized) return
    for (const [field, aliases] of Object.entries(ALIASES)) {
      if (field in matched) continue
      if (aliases.includes(normalized)) {
        matched[field] = index
        return
      }
    }
  })
  return matched
}

function cell(row: string[], index: number | undefined): string | null {
  if (index === undefined) return null
  const value = (row[index] ?? "").trim()
  return value || null
}

/** A domain reduced to its bare host, so two spellings dedupe to one company. */
function normalizeDomain(value: string | null): string {
  if (!value) return ""
  let host = value.trim().toLowerCase()
  host = host.split("://").pop() ?? host
  host = host.split("/")[0]!.split("?")[0]!.split("#")[0]!.split(":")[0]!
  if (host.startsWith("www.")) host = host.slice(4)
  return host.replace(/^\.+|\.+$/g, "")
}

export function buildImport(parsed: ParsedCsv): OutreachImport {
  const columns = matchColumns(parsed.headers)

  const companies: OutreachImport["companies"] = []
  // Two indexes because a file may identify a company either way, and the same
  // employer can appear with a domain on one row and only a name on the next.
  const byDomain = new Map<string, number>()
  const byName = new Map<string, number>()
  const prospects: OutreachProspectIn[] = []

  for (const row of parsed.rows) {
    const domain = normalizeDomain(cell(row, columns.company_domain))
    const companyName = cell(row, columns.company_name)
    const nameKey = companyName?.toLowerCase() ?? ""

    let companyIndex: number | null = null
    if (domain && byDomain.has(domain)) {
      companyIndex = byDomain.get(domain)!
    } else if (!domain && nameKey && byName.has(nameKey)) {
      companyIndex = byName.get(nameKey)!
    } else if (domain || companyName) {
      companyIndex = companies.length
      companies.push({
        name: companyName,
        domain: domain || null,
        industry: cell(row, columns.company_industry),
        linkedin_url: cell(row, columns.company_linkedin),
        context: cell(row, columns.context),
      })
      if (domain) byDomain.set(domain, companyIndex)
      if (nameKey) byName.set(nameKey, companyIndex)
    }

    const email = cell(row, columns.email)
    const fullName = cell(row, columns.full_name)
    const firstName = cell(row, columns.first_name)
    const lastName = cell(row, columns.last_name)

    // A row that names nobody is a company-only row: the company is recorded and
    // there is no person to add.
    if (!email && !fullName && !firstName && !lastName) continue

    prospects.push({
      email,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      job_title: cell(row, columns.job_title),
      seniority: cell(row, columns.seniority),
      department: cell(row, columns.department),
      linkedin_url: cell(row, columns.linkedin_url),
      city: cell(row, columns.city),
      country: cell(row, columns.country),
      company_index: companyIndex,
    })
  }

  return { companies, prospects, replace: false }
}
