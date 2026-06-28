/**
 * The client (the user's own company) as returned by `GET /api/company`. This
 * is the tenant the session belongs to — distinct from the CRM `Company`.
 */
export interface Client {
  id: number
  name: string
  legal_business_name: string | null
  address: string | null
  country: string | null
  email: string | null
  phone: string | null
  url: string | null
  company_registration_number: string | null
  vat_registration_number: string | null
  created_at: string
  updated_at: string
}

/** Body for `PATCH /api/company`. All fields optional. */
export interface ClientUpdate {
  name?: string | null
  legal_business_name?: string | null
  address?: string | null
  country?: string | null
  email?: string | null
  phone?: string | null
  url?: string | null
  company_registration_number?: string | null
  vat_registration_number?: string | null
}
