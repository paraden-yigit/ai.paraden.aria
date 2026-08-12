import { useCallback, useState } from "react"
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
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { usePaginatedList } from "@/hooks/usePaginatedList"
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
 * A Strategic campaign uploads a list of domains and these are those domains,
 * filled in afterwards by `outreach_company_enrichment`. A Flow campaign
 * uploads nothing: its companies are wherever the people it found happen to
 * work, summed up by the API, so they arrive with a people count and none of
 * the enriched columns — nothing has been looked up about them. Both are the
 * same table because they are the same question.
 *
 * Nothing here filters or pages what it was given. The discovered half is an
 * aggregate over a pool that grows for as long as the campaign runs, so the
 * search and the page are the database's answer and the rows below are exactly
 * the rows drawn.
 */
export function CampaignCompanies({
  runId,
  campaignType,
}: {
  runId: number
  campaignType: CampaignType | null
}) {
  const [query, setQuery] = useState("")
  // A keystroke is not a search. 300ms is what the exclusion list settled on.
  const search = useDebouncedValue(query.trim(), 300)
  const [uploading, setUploading] = useState(false)

  const fetchCompanies = useCallback(
    (params: { skip?: number; limit?: number }) =>
      outreachService.listCompanies(runId, { ...params, q: search }),
    [runId, search],
  )
  const list = usePaginatedList<OutreachCompany>(fetchCompanies, {
    pageSize: PER_PAGE,
    deps: [search],
  })
  const { setPage } = list

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
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
          onUploaded={list.refetch}
        />
      </div>

      <DataState
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        emptyMessage={
          // Three different nothings, and they mean different things: nothing
          // matching what was typed, nothing to upload, and nothing uploaded.
          search
            ? `No company matches “${search}”.`
            : campaignType === "flow"
              ? "No companies yet. This campaign finds its own from the profile, and they appear here as their people are found."
              : "No companies were uploaded with this campaign."
        }
        onRetry={list.refetch}
      >
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>People</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Headquarters</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((company) => (
                // A discovered company has no id — the domain is its identity,
                // and it is unique within the list by construction.
                <TableRow key={company.id ?? company.domain}>
                  <TableCell className="font-medium">
                    {/* Falls back to the domain, which is what enrichment leaves
                      * behind when the provider has never heard of them. */}
                    {company.name ?? company.domain ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {company.domain ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {company.prospect_count || "—"}
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
          page={list.page}
          skip={list.skip}
          count={list.items.length}
          total={list.total}
          hasNextPage={list.hasNextPage}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </DataState>
    </div>
  )
}
