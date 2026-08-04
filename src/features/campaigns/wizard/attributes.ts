/**
 * The attributes a spreadsheet column can be mapped onto in the campaign
 * wizard's mapping step. Values are namespaced `contact:*` / `company:*` so the
 * backend (and the row builder) can route each mapped column to the right
 * entity.
 */

export interface AttributeOption {
  value: string
  label: string
}

export const CONTACT_ATTRIBUTES: AttributeOption[] = [
  { value: "contact:full_name", label: "Full name" },
  { value: "contact:first_name", label: "First name" },
  { value: "contact:last_name", label: "Last name" },
  { value: "contact:job_title", label: "Job title" },
  { value: "contact:seniority", label: "Seniority" },
  { value: "contact:department", label: "Department" },
  { value: "contact:linkedin_url", label: "LinkedIn URL" },
  { value: "contact:city", label: "City" },
  { value: "contact:region", label: "Region" },
  { value: "contact:country", label: "Country" },
  { value: "contact:email", label: "Email" },
  { value: "contact:phone", label: "Phone" },
]

export const COMPANY_ATTRIBUTES: AttributeOption[] = [
  { value: "company:name", label: "Company name" },
  { value: "company:domain", label: "Domain" },
  { value: "company:description", label: "Description" },
  { value: "company:year_founded", label: "Year founded" },
  { value: "company:company_type", label: "Company type" },
  { value: "company:headcount", label: "Headcount" },
  { value: "company:headcount_range", label: "Headcount range" },
  { value: "company:industry", label: "Industry" },
  { value: "company:linkedin_url", label: "LinkedIn URL" },
  { value: "company:hq_city", label: "HQ city" },
  { value: "company:hq_region", label: "HQ region" },
  { value: "company:hq_country", label: "HQ country" },
  // Free text for whatever the uploader already knows that no other column
  // fits — a CRM note, why the account is on the list. Stored for now; nothing
  // reads it yet.
  { value: "company:context", label: "Context" },
]

/** Sentinel select value meaning "don't import this column". */
export const SKIP_MAPPING = "__skip__"

/** The one thing a mapping must cover: a way to identify the company, which is
 * either its domain or its LinkedIn URL. Everything else is optional — a file of
 * people missing their addresses, or of companies with nobody named on them at
 * all, is a file we can work with, and the wizard fills in the rest afterwards.
 *
 * Note this is the *company's* LinkedIn URL, not the contact's: a row that names
 * no person has no contact profile to offer, and it is the company we search on.
 */
export const COMPANY_DOMAIN_ATTR = "company:domain"
export const COMPANY_LINKEDIN_ATTR = "company:linkedin_url"

const ALL_ATTRIBUTES = [...CONTACT_ATTRIBUTES, ...COMPANY_ATTRIBUTES]

/** A normalised key for fuzzy header matching (lowercase, alnum only). */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

// Extra header aliases that don't match an attribute label directly.
const HEADER_ALIASES: Record<string, string> = {
  name: "contact:full_name",
  fullname: "contact:full_name",
  contactname: "contact:full_name",
  firstname: "contact:first_name",
  lastname: "contact:last_name",
  surname: "contact:last_name",
  title: "contact:job_title",
  jobtitle: "contact:job_title",
  role: "contact:job_title",
  linkedin: "contact:linkedin_url",
  linkedinurl: "contact:linkedin_url",
  email: "contact:email",
  emailaddress: "contact:email",
  phone: "contact:phone",
  phonenumber: "contact:phone",
  mobile: "contact:phone",
  company: "company:name",
  companyname: "company:name",
  organization: "company:name",
  organisation: "company:name",
  account: "company:name",
  domain: "company:domain",
  website: "company:domain",
  companydomain: "company:domain",
  companywebsite: "company:domain",
  url: "company:domain",
  companylinkedin: "company:linkedin_url",
  companylinkedinurl: "company:linkedin_url",
  industry: "company:industry",
  sector: "company:industry",
  employees: "company:headcount",
  headcount: "company:headcount",
  size: "company:headcount_range",
  companysize: "company:headcount_range",
  founded: "company:year_founded",
  yearfounded: "company:year_founded",
  city: "contact:city",
  country: "contact:country",
  region: "contact:region",
  state: "contact:region",
  context: "company:context",
  companycontext: "company:context",
  notes: "company:context",
  note: "company:context",
  companynotes: "company:context",
  comments: "company:context",
  background: "company:context",
}

/**
 * Best-effort guess of the attribute a header maps to, by matching against
 * attribute labels/values and a small alias table. Returns `SKIP_MAPPING` when
 * nothing matches confidently.
 */
export function guessAttribute(header: string): string {
  const key = normalize(header)
  if (!key) return SKIP_MAPPING

  // Direct label / value match.
  for (const attr of ALL_ATTRIBUTES) {
    if (normalize(attr.label) === key) return attr.value
    if (normalize(attr.value.split(":")[1]) === key) return attr.value
  }
  // "Company X" headers → company:x
  for (const attr of COMPANY_ATTRIBUTES) {
    if (key === "company" + normalize(attr.label)) return attr.value
  }
  return HEADER_ALIASES[key] ?? SKIP_MAPPING
}
