import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutGrid, List, Plus, Rocket } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { formatDateTime, formatPoolSize } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CampaignCards } from "@/features/outreach/CampaignCards"
import { CampaignTypeBadge } from "@/features/outreach/campaignTypeBadge"
import { RunStatusBadge } from "@/features/outreach/runStatus"
import { outreachService } from "@/services/outreach.service"
import type { OutreachRun } from "@/types/outreach"

const NUMBER = new Intl.NumberFormat("en-GB")

/** The two ways of reading the same page: a row each, or a card each. */
const VIEWS = [
  { value: "list", label: "List view", icon: List },
  { value: "grid", label: "Grid view", icon: LayoutGrid },
] as const

type View = (typeof VIEWS)[number]["value"]

export function CampaignsPage() {
  const navigate = useNavigate()
  const fetchRuns = useCallback(
    (params: { skip?: number; limit?: number }) => outreachService.list(params),
    [],
  )
  const list = usePaginatedList<OutreachRun>(fetchRuns)
  // Which of the two the reader is looking at. Kept in the page rather than the
  // URL: it is how this page is being read, not a different place to be.
  const [view, setView] = useState<View>("list")

  /** Campaigns are created finished, so a row opens the campaign itself —
   * there is no half-built wizard to return to. */
  function open(run: OutreachRun) {
    navigate(`/campaigns/${run.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Build a list, pick an angle, and let Paraden write the sequence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* A segmented pair rather than two loose buttons: they are one
            * choice, and the pressed one has to look chosen rather than
            * merely hovered. */}
          <div
            role="group"
            aria-label="View"
            className="flex items-center rounded-md border p-0.5"
          >
            {VIEWS.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="icon"
                className={cn(
                  "size-8",
                  view === option.value && "bg-muted text-foreground",
                )}
                aria-pressed={view === option.value}
                title={option.label}
                onClick={() => setView(option.value)}
              >
                <option.icon className="size-4" />
                <span className="sr-only">{option.label}</span>
              </Button>
            ))}
          </div>
          <Button onClick={() => navigate("/campaigns/new")}>
            <Plus className="size-4" />
            New campaign
          </Button>
        </div>
      </div>

      <DataState
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        emptyMessage="No campaigns yet. Start one and Paraden will research each prospect and draft the outreach for you."
        emptyAction={
          <Button onClick={() => navigate("/campaigns/new")}>
            <Rocket className="size-4" />
            Start a campaign
          </Button>
        }
        onRetry={list.refetch}
      >
        {view === "grid" ? (
          <CampaignCards runs={list.items} />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reach</TableHead>
                  <TableHead>Prospects</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.items.map((run) => (
                  <TableRow
                    key={run.id}
                    // Taller than the default row: this is a list you scan for
                    // one campaign by name, and the extra air is what makes a
                    // row findable rather than a line in a block of text.
                    className="cursor-pointer [&>td]:py-4"
                    onClick={() => open(run)}
                  >
                    <TableCell className="font-medium">{run.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {run.product_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <CampaignTypeBadge type={run.campaign_type} />
                    </TableCell>
                    <TableCell>
                      <RunStatusBadge status={run.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {run.monthly_reach == null ? (
                        // Never allocated, which is not the same as none.
                        "—"
                      ) : (
                        <>
                          {NUMBER.format(run.monthly_reach)}
                          <span className="ml-1 text-xs">/mo</span>
                        </>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {/* The pool the profile matched, read the same way the
                        * wizard reads it — there is no reachable/unreachable
                        * split to make: the pool is the prospects. */}
                      {run.pool_total == null
                        ? "—"
                        : formatPoolSize(run.pool_total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(run.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <PaginationFooter
          page={list.page}
          skip={list.skip}
          count={list.items.length}
          total={list.total}
          hasNextPage={list.hasNextPage}
          onPrev={() => list.setPage((p) => Math.max(0, p - 1))}
          onNext={() => list.setPage((p) => p + 1)}
        />
      </DataState>
    </div>
  )
}
