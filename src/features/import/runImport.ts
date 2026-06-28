import { companyService } from "@/services/company.service"
import { contactService } from "@/services/contact.service"
import { ApiError } from "@/services/http"
import type { Company, CompanyCreate } from "@/types/company"
import type { ContactCreate } from "@/types/contact"
import type { SpreadsheetRow } from "@/lib/spreadsheet"

/** Mapping value for a column the user chose not to import. */
export const IMPORT_IGNORE = "__ignore__"

/** Company fields that must be coerced from text to a non-negative integer. */
const COMPANY_NUMERIC_FIELDS = new Set(["year_founded", "headcount"])

/** Max number of per-row errors kept for display (the rest are summarized). */
const MAX_ERRORS = 50

export interface ImportSummary {
  companiesCreated: number
  contactsCreated: number
  skipped: number
  errors: string[]
}

interface RowPayload {
  company: Partial<CompanyCreate>
  contact: Partial<ContactCreate>
}

const norm = (value?: string | null) => (value ?? "").trim().toLowerCase()

/** A company is identifiable (per the API) if it has a name or a domain. */
const companyHasIdentity = (c: Partial<CompanyCreate>) =>
  Boolean(c.name?.trim() || c.domain?.trim())

/** A contact is valid (per the API) with a full name, or first + last. */
const contactHasIdentity = (c: Partial<ContactCreate>) =>
  Boolean(c.full_name?.trim() || (c.first_name?.trim() && c.last_name?.trim()))

function errorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return "Unexpected error."
  // Surface FastAPI 422 detail (field + reason) instead of the bare status text.
  if (err.details?.length) {
    return err.details
      .map((d) => {
        const field = d.loc.filter((p) => p !== "body").join(".")
        return field ? `${field}: ${d.msg}` : d.msg
      })
      .join("; ")
  }
  return err.message || "Request failed."
}

/** Split a row into company and contact field maps per the column mapping. */
function buildRowPayload(row: SpreadsheetRow, mapping: Record<string, string>): RowPayload {
  const company: Record<string, unknown> = {}
  const contact: Record<string, string> = {}

  for (const [label, target] of Object.entries(mapping)) {
    if (!target || target === IMPORT_IGNORE) continue
    const raw = (row[label] ?? "").trim()
    if (!raw) continue

    const [section, field] = target.split(":")
    if (section === "company") {
      if (COMPANY_NUMERIC_FIELDS.has(field)) {
        const n = Number(raw)
        if (Number.isFinite(n) && n >= 0) company[field] = Math.trunc(n)
      } else {
        company[field] = raw
      }
    } else if (section === "contact") {
      contact[field] = raw
    }
  }

  return {
    company: company as Partial<CompanyCreate>,
    contact: contact as Partial<ContactCreate>,
  }
}

/**
 * Create companies and contacts from the mapped spreadsheet rows.
 *
 * Companies are de-duplicated by domain (preferred) or name across the whole
 * import and against the client's existing companies, so contacts that share a
 * company attach to a single record. Each contact is created under its row's
 * resolved company. Per-row problems are collected rather than aborting.
 */
export async function runImport(
  rows: SpreadsheetRow[],
  mapping: Record<string, string>,
  existingCompanies: Company[],
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    companiesCreated: 0,
    contactsCreated: 0,
    skipped: 0,
    errors: [],
  }

  // Index known companies by domain and by name so either can resolve a row.
  const idByKey = new Map<string, number>()
  const indexCompany = (c: Pick<Company, "id" | "name" | "domain">) => {
    if (norm(c.domain)) idByKey.set(`d:${norm(c.domain)}`, c.id)
    if (norm(c.name)) idByKey.set(`n:${norm(c.name)}`, c.id)
  }
  existingCompanies.forEach(indexCompany)

  const lookupCompanyId = (c: Partial<CompanyCreate>): number | undefined => {
    if (norm(c.domain) && idByKey.has(`d:${norm(c.domain)}`)) {
      return idByKey.get(`d:${norm(c.domain)}`)
    }
    if (norm(c.name) && idByKey.has(`n:${norm(c.name)}`)) {
      return idByKey.get(`n:${norm(c.name)}`)
    }
    return undefined
  }

  let refetched = false
  async function resolveCompany(
    company: Partial<CompanyCreate>,
  ): Promise<{ id: number; created: boolean }> {
    const known = lookupCompanyId(company)
    if (known !== undefined) return { id: known, created: false }

    try {
      const created = await companyService.create(company as CompanyCreate)
      indexCompany(created)
      return { id: created.id, created: true }
    } catch (err) {
      // Domain already exists but wasn't in our index — refetch once and reuse.
      if (err instanceof ApiError && err.status === 409 && !refetched) {
        refetched = true
        const all = await companyService.list({ limit: 200 })
        all.items.forEach(indexCompany)
        const again = lookupCompanyId(company)
        if (again !== undefined) return { id: again, created: false }
      }
      throw err
    }
  }

  const pushError = (message: string) => {
    if (summary.errors.length < MAX_ERRORS) summary.errors.push(message)
  }

  for (let i = 0; i < rows.length; i++) {
    // +2: account for the 0-based index and the skipped header row, so the
    // number matches what the user sees in their spreadsheet.
    const rowNum = i + 2
    const { company, contact } = buildRowPayload(rows[i], mapping)
    const hasCompany = companyHasIdentity(company)
    const contactAttempted = Object.keys(contact).length > 0

    if (!hasCompany && !contactAttempted) {
      summary.skipped++
      continue
    }

    if (!hasCompany) {
      summary.skipped++
      pushError(`Row ${rowNum}: a contact needs a company (name or domain) — skipped.`)
      continue
    }

    let companyId: number
    let companyCreated: boolean
    try {
      const resolved = await resolveCompany(company)
      companyId = resolved.id
      companyCreated = resolved.created
      if (companyCreated) summary.companiesCreated++
    } catch (err) {
      summary.skipped++
      pushError(`Row ${rowNum}: ${errorMessage(err)}`)
      continue
    }

    let contactCreated = false
    if (contactAttempted) {
      if (!contactHasIdentity(contact)) {
        pushError(
          `Row ${rowNum}: contact needs a full name or first + last name — contact skipped.`,
        )
      } else {
        try {
          await contactService.create(companyId, contact as ContactCreate)
          summary.contactsCreated++
          contactCreated = true
        } catch (err) {
          pushError(`Row ${rowNum}: ${errorMessage(err)}`)
        }
      }
    }

    // Nothing new came from this row (e.g. a duplicate company, no contact).
    if (!companyCreated && !contactCreated) summary.skipped++
  }

  return summary
}
