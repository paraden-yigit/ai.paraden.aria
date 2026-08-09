import { useCallback, useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAsync } from "@/hooks/useAsync"
import { formatDate, formatRelativeTime } from "@/lib/format"
import { outreachService } from "@/services/outreach.service"
import type { CampaignType, OutreachCompany } from "@/types/outreach"
import { CompanyUploadDialog } from "./CompanyUploadDialog"

// Enough that a normal upload is one or two pages, few enough that the table
// stays a table rather than a scroll.
const PER_PAGE = 30

function place(company: OutreachCompany): string {
  return [company.hq_city, company.hq_country].filter(Boolean).join(", ") || "—"
}

/**
 * The companies a campaign is aimed at.
 *
 * Only a Strategic campaign has any: it is uploaded as a list of domains and
 * these are those domains, filled in afterwards by
 * `outreach_company_enrichment`. A Flow campaign describes the companies it
 * wants and finds them per send, so there is no list to show — which the empty
 * state says, rather than leaving a table that looks like it failed to load.
 */
export function CampaignCompanies({
  runId,
  campaignType,
}: {
  runId: number
  campaignType: CampaignType | null
}) {
  const fetchCompanies = useCallback(
    () => outreachService.listCompanies(runId),
    [runId],
  )
  const { data, loading, error, refetch } = useAsync(fetchCompanies, [
    fetchCompanies,
  ])
  const companies = useMemo(() => data ?? [], [data])

  const [query, setQuery] = useState("")
  const [uploading, setUploading] = useState(false)
  const [page, setPage] = useState(0)

  // Name and domain, because those are the two ways anyone refers to a company
  // — and on a list uploaded as domains, the domain is often the only one the
  // reader knows.
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return companies
    return companies.filter(
      (company) =>
        (company.name ?? "").toLowerCase().includes(needle) ||
        (company.domain ?? "").toLowerCase().includes(needle),
    )
  }, [companies, query])

  // Paged here rather than by the API: the whole list is already loaded for the
  // search to work on, and paging it server-side would mean searching there
  // too. Worth revisiting if a campaign ever holds thousands of companies.
  const lastPage = Math.max(0, Math.ceil(matches.length / PER_PAGE) - 1)
  // A filter that shortens the list can leave the reader past the end of it.
  const current = Math.min(page, lastPage)
  const skip = current * PER_PAGE
  const shown = matches.slice(skip, skip + PER_PAGE)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-9"
            placeholder="Search by name or domain"
            aria-label="Search companies"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              // A new search is a new list; page 4 of the old one means
              // nothing.
              setPage(0)
            }}
          />
        </div>
        <Button variant="outline" onClick={() => setUploading(true)}>
          <Plus className="size-4" />
          Add companies
        </Button>
        <CompanyUploadDialog
          runId={runId}
          open={uploading}
          onOpenChange={setUploading}
          // The list on screen is the one that just changed, so it reloads
          // rather than waiting for the tab to be left and come back.
          onUploaded={refetch}
        />
      </div>

      <DataState
      loading={loading}
      error={error}
      isEmpty={matches.length === 0}
      emptyMessage={
        // Three different nothings, and they mean different things: nothing
        // uploaded, nothing to upload, and nothing matching what was typed.
        query.trim()
          ? `No company matches "${query.trim()}".`
          : campaignType === "flow"
            ? "This campaign finds its own companies from the profile, so there is no uploaded list."
            : "No companies were uploaded with this campaign."
      }
      onRetry={refetch}
    >
      {query.trim() && (
        // Only while filtering: unfiltered, the footer's "Showing 1 to 30 of
        // 43" already says it.
        <p className="text-sm text-muted-foreground">
          {matches.length} of {companies.length} match
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Headquarters</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">
                  {/* Falls back to the domain, which is what enrichment leaves
                    * behind when the provider has never heard of them. */}
                  {company.name ?? company.domain ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.domain ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.industry ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {place(company)}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {/* Relative for reading, exact on hover for checking. */}
                  <Tooltip>
                    <TooltipTrigger className="cursor-default">
                      {formatRelativeTime(company.created_at)}
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatDate(company.created_at)}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationFooter
        page={current}
        skip={skip}
        count={shown.length}
        total={matches.length}
        hasNextPage={current < lastPage}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(lastPage, p + 1))}
      />
      </DataState>
    </div>
  )
}
