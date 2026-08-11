import { useCallback, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  CalendarRange,
  ChevronsUpDown,
  Search,
  Users,
  X,
} from "lucide-react"

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
import { presetRange, type DateRange } from "@/lib/dateRanges"
import { formatDate, formatDay, formatRelativeTime } from "@/lib/format"
import { outreachService } from "@/services/outreach.service"
import { DateRangePicker } from "./DateRangePicker"
import type {
  CampaignType,
  OutreachProspect,
  ProspectSort,
  SortDirection,
} from "@/types/outreach"

// The same page size the wizard's list uses, for the same reason: a page that
// is read rather than scrolled.
const PER_PAGE = 25

const COLUMNS: { key: ProspectSort; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "company", label: "Company" },
  // Its own column rather than a fallback inside Company: on a pool found by
  // domain, it is the value that identifies the employer, not a stand-in for a
  // missing name.
  { key: "domain", label: "Domain" },
  { key: "location", label: "Location" },
  { key: "added", label: "Added" },
]

function name(prospect: OutreachProspect): string {
  return (
    prospect.full_name ||
    [prospect.first_name, prospect.last_name].filter(Boolean).join(" ") ||
    "—"
  )
}

function place(prospect: OutreachProspect): string {
  return [prospect.city, prospect.country].filter(Boolean).join(", ") || "—"
}

/**
 * The people this campaign has to write to.
 *
 * Two kinds sit in the same table. An uploaded one came in on a spreadsheet
 * with an address already on them. A discovered one was found by the top-up
 * task against the campaign's profile — People Search returns who someone is
 * and where they work, never their address, so they arrive without one and are
 * shown anyway. Hiding them would make a stocked campaign look empty, which is
 * exactly the thing worth being able to see.
 *
 * Nothing here filters or sorts what it was given: a pool the task keeps
 * filling has no size to design around, so the search, the order and the page
 * are all the database's answer, and the rows below are exactly the rows drawn.
 *
 * Read-only on purpose: this is the pool as it stands, and what spends it is
 * the sender.
 */
export function CampaignProspects({
  runId,
  campaignType,
}: {
  runId: number
  campaignType: CampaignType | null
}) {
  const [query, setQuery] = useState("")
  // A keystroke is not a search. 300ms is what the exclusion list settled on.
  const search = useDebouncedValue(query.trim(), 300)
  const [sort, setSort] = useState<ProspectSort>("name")
  const [direction, setDirection] = useState<SortDirection>("asc")
  // Null is "any time", and it is the default: a pool fills over months, and a
  // tab that opened already filtered would be hiding most of it without saying
  // so. The filter is something you turn on.
  const [added, setAdded] = useState<DateRange | null>(null)

  const fetchProspects = useCallback(
    (params: { skip?: number; limit?: number }) =>
      outreachService.listProspects(runId, {
        ...params,
        q: search,
        added_from: added?.from,
        added_to: added?.to,
        sort,
        direction,
      }),
    [runId, search, added, sort, direction],
  )
  const list = usePaginatedList<OutreachProspect>(fetchProspects, {
    pageSize: PER_PAGE,
    deps: [search, added?.from, added?.to, sort, direction],
  })
  const { setPage } = list

  function sortBy(key: ProspectSort) {
    // Clicking the column already sorted turns it round; a new column starts
    // the way people expect to read one — A to Z, and nothing first.
    if (key === sort) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSort(key)
      setDirection("asc")
    }
    // Page 4 of the old order is not page 4 of the new one.
    setPage(0)
  }

  // What the count is counting. Both filters narrow it, and a total that does
  // not say which of them is in force reads as the size of the campaign.
  const period = added
    ? added.from === added.to
      ? `added ${formatDay(added.from)}`
      : `added ${formatDay(added.from)}–${formatDay(added.to)}`
    : ""
  const summary = search
    ? `matching “${search}”${period ? ` and ${period}` : ""}`
    : period || "on this campaign"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            className="pl-9"
            placeholder="Search by name, role, company or domain"
            aria-label="Search prospects"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
          />
        </div>

        {/* Off until it is turned on, and turned off again in one click. A
          * range that can only be widened is a filter you cannot undo. */}
        {added ? (
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              value={added}
              onChange={(next) => {
                setAdded(next)
                setPage(0)
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdded(null)
                setPage(0)
              }}
            >
              <X className="size-4" />
              Clear
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              // Month to date: the period anyone narrowing a list means when
              // they have not said, and the same default Performance uses.
              setAdded(presetRange("this_month"))
              setPage(0)
            }}
          >
            <CalendarRange className="size-4" />
            Filter by date added
          </Button>
        )}

        {typeof list.total === "number" && (
          <p className="text-sm text-muted-foreground sm:ml-auto">
            <Users className="mr-1.5 inline size-4" aria-hidden />
            {list.total} {list.total === 1 ? "person" : "people"} {summary}
          </p>
        )}
      </div>

      <DataState
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        emptyMessage={
          // A filter that found nothing and a campaign that has nobody are
          // different problems, and only one of them is fixed by waiting.
          search || added
            ? `Nobody on this campaign ${summary}.`
            : campaignType === "flow"
              ? "Nobody yet. This campaign finds its own people from the profile, and they appear here once it has an email address for them."
              : "Nobody on this campaign yet."
        }
        onRetry={list.refetch}
      >
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column) => {
                  const active = sort === column.key
                  const Icon = !active
                    ? ChevronsUpDown
                    : direction === "asc"
                      ? ArrowUp
                      : ArrowDown
                  return (
                    <TableHead
                      key={column.key}
                      // On the header cell rather than the button: what a
                      // screen reader announces about the column, and what the
                      // arrow says visually, are the same fact.
                      aria-sort={
                        active
                          ? direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className="-mx-2 flex items-center gap-1.5 rounded px-2 py-1 hover:text-foreground"
                        aria-label={`Sort by ${column.label.toLowerCase()}`}
                        onClick={() => sortBy(column.key)}
                      >
                        {column.label}
                        <Icon
                          aria-hidden
                          className={
                            active
                              ? "size-3.5"
                              : "size-3.5 text-muted-foreground/50"
                          }
                        />
                      </button>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell>
                    <div className="font-medium">{name(prospect)}</div>
                    {/* The address belongs to the person, so it sits under
                      * their name rather than in a column of its own. Every
                      * row has one — the API only lists people who can be
                      * written to. */}
                    <div className="text-xs text-muted-foreground">
                      {prospect.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {prospect.job_title || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {prospect.company_name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {prospect.company_domain || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {place(prospect)}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {/* Relative for reading, exact on hover for checking —
                      * the same treatment the Companies tab gives it. */}
                    <Tooltip>
                      <TooltipTrigger className="cursor-default">
                        {formatRelativeTime(prospect.created_at)}
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatDate(prospect.created_at)}
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
