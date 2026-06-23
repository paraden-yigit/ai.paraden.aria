/**
 * A person associated with a company, sourced from FullEnrich people-search.
 * Mirrors the API's ContactRead. People-search returns profile data only, so
 * `email`/`phone` are null until a future contact-enrichment step fills them.
 */
export interface Contact {
  id: number
  company_id: number
  external_id: string | null
  full_name: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  seniority: string | null
  department: string | null
  linkedin_url: string | null
  city: string | null
  region: string | null
  country: string | null
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface ContactCreate {
  full_name: string
  first_name?: string | null
  last_name?: string | null
  job_title?: string | null
  seniority?: string | null
  department?: string | null
  linkedin_url?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
  email?: string | null
  phone?: string | null
}

export type ContactUpdate = Partial<ContactCreate>

/** A contact plus its owning company's name (client-wide contacts list). */
export interface ContactWithCompany extends Contact {
  company_name: string
}

