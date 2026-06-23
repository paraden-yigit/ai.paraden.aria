/**
 * Standard response envelope used by every endpoint in ai.paraden.api:
 *   { success: boolean, message: string, data: T | null }
 */
export interface ApiEnvelope<T = unknown> {
  success: boolean
  message: string
  data: T | null
}

/** A single FastAPI validation error item (422 responses). */
export interface ValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
}

/** Normalized result of a paginated list/search endpoint. */
export interface ListResult<T> {
  items: T[]
  /** Total count if the API provides one; otherwise undefined. */
  total?: number
}

/** Offset pagination params shared by all list endpoints. */
export interface PaginationParams {
  skip?: number
  limit?: number
}
