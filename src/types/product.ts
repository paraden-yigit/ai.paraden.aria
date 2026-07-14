/**
 * A product owned by the authenticated user's client. Shape mirrors the API's
 * ProductRead: a `name` plus the product-brief answers edited on the product
 * detail page (all free-text and optional for now).
 */
export interface Product {
  id: number
  client_id: number
  name: string
  offering: string | null
  audience: string | null
  problem_solved: string | null
  buyer_challenges: string | null
  proof_points: string | null
  buyer_outcome: string | null
  created_at: string
  updated_at: string
}

export interface ProductCreate {
  name: string
  offering?: string | null
  audience?: string | null
  problem_solved?: string | null
  buyer_challenges?: string | null
  proof_points?: string | null
  buyer_outcome?: string | null
}

export type ProductUpdate = Partial<ProductCreate>

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

/** Extraction lifecycle of a supporting file, driven by the background task. */
export type ExtractionStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"

/** A supporting file uploaded against a product (metadata only). */
export interface ProductFile {
  id: number
  product_id: number
  filename: string
  content_type: string
  size_bytes: number
  extraction_status: ExtractionStatus
  extraction_error: string | null
  created_at: string
  updated_at: string
}
