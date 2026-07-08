/**
 * Types for the campaign wizard's CSV contact upload. The client parses the CSV,
 * maps its columns onto contact/company attributes, and posts the mapped rows;
 * the API normalises them into the campaign's companies and contacts.
 */

export interface UploadedContactInput {
  full_name?: string | null
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

export interface UploadedCompanyInput {
  name?: string | null
  domain?: string | null
  description?: string | null
  year_founded?: string | null
  company_type?: string | null
  headcount?: string | null
  headcount_range?: string | null
  industry?: string | null
  linkedin_url?: string | null
  hq_city?: string | null
  hq_region?: string | null
  hq_country?: string | null
}

export interface UploadedRow {
  contact: UploadedContactInput
  company: UploadedCompanyInput
}

export interface UploadedContactsPayload {
  rows: UploadedRow[]
}

export interface UploadResult {
  companies_created: number
  contacts_created: number
}

/** A contact as returned by the step-4 review. */
export interface CampaignUploadedContact {
  id: number
  full_name: string | null
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
}

/** A company (with its people) as returned by the step-4 review. */
export interface CampaignCompanyReview {
  id: number
  name: string | null
  domain: string | null
  description: string | null
  year_founded: number | null
  company_type: string | null
  headcount: number | null
  headcount_range: string | null
  industry: string | null
  linkedin_url: string | null
  hq_city: string | null
  hq_region: string | null
  hq_country: string | null
  contacts: CampaignUploadedContact[]
}

export interface CampaignUploadReview {
  companies: CampaignCompanyReview[]
  unassigned_contacts: CampaignUploadedContact[]
  total_companies: number
  total_contacts: number
}
