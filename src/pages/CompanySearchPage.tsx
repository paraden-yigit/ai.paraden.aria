import { useRef, useState } from "react"
import { Search } from "lucide-react"

import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { CompanySearchForm } from "@/features/fullenrich/CompanySearchForm"
import { CompanyResults } from "@/features/fullenrich/CompanyResults"
import { fullEnrichService } from "@/services/fullenrich.service"
import { ApiError } from "@/services/http"
import type {
  FullEnrichCompanySearchRequest,
  FullEnrichCompanySearchResponse,
} from "@/types/fullenrich"

// Fixed page size; the right-column pagination drives the request offset.
const LIMIT = 20

export function CompanySearchPage() {
  const [result, setResult] = useState<FullEnrichCompanySearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The active filter set (null until the first search), plus current offset.
  const [filters, setFilters] = useState<FullEnrichCompanySearchRequest | null>(null)
  const [offset, setOffset] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  async function fetchPage(
    activeFilters: FullEnrichCompanySearchRequest,
    pageOffset: number,
  ) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const data = await fullEnrichService.searchCompanies(
        { ...activeFilters, limit: LIMIT, offset: pageOffset },
        controller.signal,
      )
      setResult(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setResult(null)
      setError(
        err instanceof ApiError ? err.message : "FullEnrich company search failed.",
      )
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }

  function handleSearch(newFilters: FullEnrichCompanySearchRequest) {
    setFilters(newFilters)
    setOffset(0)
    fetchPage(newFilters, 0)
  }

  function goToOffset(nextOffset: number) {
    if (!filters) return
    setOffset(nextOffset)
    fetchPage(filters, nextOffset)
  }

  function handleReset() {
    abortRef.current?.abort()
    setFilters(null)
    setOffset(0)
    setResult(null)
    setError(null)
  }

  const companies = result?.companies ?? []
  const total = result?.metadata?.total
  const hasNextPage =
    typeof total === "number"
      ? offset + companies.length < total
      : companies.length === LIMIT

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Company Search — Full Enrich
        </h1>
        <p className="text-muted-foreground">
          Search FullEnrich's company database by keyword, industry, location, and more.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column — the search form. */}
        <div className="rounded-lg border p-5">
          <CompanySearchForm
            onSearch={handleSearch}
            onReset={handleReset}
            submitting={loading}
          />
        </div>

        {/* Right column — the results, with pagination. */}
        <div>
          {filters === null ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              <Search className="size-8" />
              <p className="text-sm">
                Fill in the form and run a search to see matching companies here.
              </p>
            </div>
          ) : (
            <DataState
              loading={loading}
              error={error}
              isEmpty={companies.length === 0}
              emptyMessage="No companies matched your filters."
              onRetry={() => filters && fetchPage(filters, offset)}
            >
              <CompanyResults companies={companies} metadata={result?.metadata} />
              <PaginationFooter
                page={Math.floor(offset / LIMIT)}
                skip={offset}
                count={companies.length}
                total={total}
                hasNextPage={hasNextPage}
                onPrev={() => goToOffset(Math.max(0, offset - LIMIT))}
                onNext={() => goToOffset(offset + LIMIT)}
              />
            </DataState>
          )}
        </div>
      </div>
    </div>
  )
}
