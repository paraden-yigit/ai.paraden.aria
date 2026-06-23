import type { ListResult } from "@/types/api"

/**
 * Normalize an (untyped) list/search `data` payload into { items, total }.
 * The API may return either a bare array or a paginated wrapper, so we handle
 * both rather than assume one shape. Shared by every list-style service.
 */
export function normalizeList<T>(data: unknown): ListResult<T> {
  if (Array.isArray(data)) {
    return { items: data as T[] }
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    const items = (obj.items ?? obj.results ?? obj.data ?? []) as T[]
    const total = (obj.total ?? obj.count ?? obj.total_count) as number | undefined
    return { items: Array.isArray(items) ? items : [], total }
  }
  return { items: [] }
}
