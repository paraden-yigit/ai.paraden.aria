// The product's generated Ideal Customer Profile (mirrors the API's IcpRead).

export type IcpStatus = "generating" | "ready" | "failed"

export interface Icp {
  id: number
  // Exactly one of these is set: a product ICP (template) or a campaign clone.
  product_id: number | null
  campaign_id: number | null
  client_id: number
  status: IcpStatus
  error: string | null

  // A. Company attributes
  keywords: string[]
  specialties: string[]
  industries: string[]
  company_types: string[]
  headcount_min: number | null
  headcount_max: number | null
  countries: string[]

  // B. Contact attributes
  seniority: string[]
  job_functions: string[]
  job_subfunctions: string[]

  created_at: string
  updated_at: string
}

/** Partial edit payload — only the provided attributes change. */
export interface IcpUpdate {
  keywords?: string[]
  specialties?: string[]
  industries?: string[]
  company_types?: string[]
  headcount_min?: number | null
  headcount_max?: number | null
  countries?: string[]
  seniority?: string[]
  job_functions?: string[]
  job_subfunctions?: string[]
}
