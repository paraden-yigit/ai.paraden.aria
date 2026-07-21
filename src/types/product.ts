/**
 * A product owned by the authenticated user's client. Shape mirrors the API's
 * ProductRead: a `name` plus the wizard answers (value proposition, USP,
 * demonstrable ROI). Structured pain points and personas are fetched separately.
 */
export interface Product {
  id: number
  client_id: number
  name: string
  value_proposition: string | null
  usp: string | null
  demonstrable_roi: string | null
  created_at: string
  updated_at: string
}

/** A structured pain point supplied at creation (wizard step 4). */
export interface PainPointInput {
  name: string
  challenge: string
  why_it_matters: string
  how_it_helps: string
}

export interface ProductCreate {
  name: string
  value_proposition?: string | null
  usp?: string | null
  demonstrable_roi?: string | null
  /** Created alongside the product, in order. */
  pain_points?: PainPointInput[]
}

/** Editing a product only touches its scalar fields; pain points have their own
 * endpoints. */
export type ProductUpdate = Partial<
  Pick<ProductCreate, "name" | "value_proposition" | "usp" | "demonstrable_roi">
>

/**
 * A product's access list — the teams and individual users it is assigned to.
 * Mirrors the API's ProductAssignmentsRead. Everyone on an assigned team, each
 * assigned user, and those users' team leaders can see and use the product.
 * Empty on both sides means the product is owner-only. Owner-managed.
 */
export interface ProductAssignments {
  team_ids: number[]
  user_ids: number[]
}

/**
 * A product persona — an exact job title/role the client wants to reach.
 * Mirrors the API's ProductPersonaRead. Deliberately not tied to the FullEnrich
 * taxonomy: these exact titles take priority when picking company contacts. A
 * product keeps between 2 and 5.
 */
export interface ProductPersona {
  id: number
  product_id: number
  title: string
  created_at: string
}

/** How many personas a product may have (min is a UI nudge, max is enforced). */
export const PERSONA_MIN = 2
export const PERSONA_MAX = 5

/**
 * A product's stored pain point. Mirrors the API's ProductPainPointRead: the
 * challenge the prospect faces, why it matters, and how the product helps.
 */
export interface ProductPainPoint {
  id: number
  product_id: number
  name: string
  challenge: string
  why_it_matters: string
  how_it_helps: string
  position: number
  created_at: string
}

/** Extraction lifecycle of a supporting file, driven by the background task. */
export type ExtractionStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"

/**
 * The categories a supporting file can be tagged with (must match the API's
 * app.services.product_file_categories). `value` is stored; `label` is shown.
 */
export const FILE_CATEGORIES: { value: string; label: string }[] = [
  { value: "proof_source_data", label: "Proof Source Data (PSD)" },
  { value: "agenda", label: "Agenda" },
  { value: "media_pack", label: "Media pack" },
  { value: "product_pack", label: "Product pack" },
  { value: "case_studies", label: "Case studies" },
  { value: "customer_audience_list", label: "Customer / audience list" },
  { value: "sales_deck", label: "Sales deck" },
  { value: "testimonials", label: "Testimonials" },
  { value: "research_reports", label: "Research reports" },
  { value: "delegate_attendee_list", label: "Delegate / attendee list" },
  { value: "survey_audience_research", label: "Survey / audience research" },
  { value: "battle_cards", label: "Battle cards / competitor comparisons" },
]

/** Human label for a stored category value (falls back to the raw value). */
export function fileCategoryLabel(value: string | null): string | null {
  if (!value) return null
  return FILE_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

/** A supporting file uploaded against a product (metadata only). */
export interface ProductFile {
  id: number
  product_id: number
  filename: string
  content_type: string
  size_bytes: number
  category: string | null
  extraction_status: ExtractionStatus
  extraction_error: string | null
  created_at: string
  updated_at: string
}
