import { useState } from "react"
import { useAsync } from "@/hooks/useAsync"
import type { ListResult, PaginationParams } from "@/types/api"

interface UsePaginatedListOptions {
  pageSize?: number
  /** Extra values that, when changed, refetch the current page. */
  deps?: unknown[]
}

/**
 * Generic offset-pagination hook for any list endpoint returning ListResult<T>.
 * Owns the page state and derives `hasNextPage`; pair with a service `list`
 * method. Works for clients, users, and any future paginated resource.
 *
 * Pass a stable `fetcher` (service methods are module singletons, so they
 * qualify) — refetching is driven by `skip`, `pageSize`, and `deps`.
 */
export function usePaginatedList<T>(
  fetcher: (params: PaginationParams) => Promise<ListResult<T>>,
  { pageSize = 25, deps = [] }: UsePaginatedListOptions = {},
) {
  const [page, setPage] = useState(0)
  const skip = page * pageSize

  const { data, loading, error, refetch } = useAsync(
    () => fetcher({ skip, limit: pageSize }),
    [skip, pageSize, ...deps],
  )

  const items = data?.items ?? []
  const total = data?.total
  const hasNextPage =
    typeof total === "number" ? skip + items.length < total : items.length === pageSize

  return {
    items,
    total,
    page,
    setPage,
    skip,
    pageSize,
    hasNextPage,
    loading,
    error,
    refetch,
  }
}
