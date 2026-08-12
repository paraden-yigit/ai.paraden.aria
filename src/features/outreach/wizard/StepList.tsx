import { useCallback, useRef, useState } from "react"
import { Trash2, Upload, Users } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataState } from "@/components/DataState"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { PaginationFooter } from "@/components/PaginationFooter"
import {
  SPREADSHEET_ACCEPT,
  isSpreadsheetFile,
  parseCsvFile,
  type ParsedCsv,
} from "@/lib/spreadsheet"
import { outreachService } from "@/services/outreach.service"
import type { OutreachProspect } from "@/types/outreach"
import { StepFrame } from "./StepFrame"
import { buildImport } from "./mapping"

/**
 * The list step: who this run is for.
 *
 * A spreadsheet is accepted on the loosest terms that still work — a company
 * domain alone is enough to research and to write about. Columns are matched by
 * header name rather than by position, so the same file works whatever order it
 * came in (see `mapping.ts`).
 *
 * Rows without an email address are kept and shown rather than rejected: the
 * list is a working document, and telling someone their file was half-wrong is
 * more useful than silently dropping half of it. They are simply never written
 * for and never enrolled.
 */
export function StepList({ runId }: { runId: number }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const fetchProspects = useCallback(
    (params: { skip?: number; limit?: number }) =>
      outreachService.listProspects(runId, params),
    [runId],
  )
  const list = usePaginatedList<OutreachProspect>(fetchProspects)

  async function handleFile(file: File) {
    if (!isSpreadsheetFile(file)) {
      toast.error("That file type isn't supported. Use a CSV or Excel file.")
      return
    }
    setImporting(true)
    try {
      const parsed: ParsedCsv = await parseCsvFile(file)
      const payload = buildImport(parsed)
      if (payload.prospects.length === 0 && payload.companies.length === 0) {
        toast.error(
          "Nothing recognisable in that file. It needs a column for an email, " +
            "a name, or a company domain.",
        )
        return
      }
      const result = await outreachService.importProspects(runId, payload)
      toast.success(
        `Added ${result.prospects_created} ${
          result.prospects_created === 1 ? "person" : "people"
        }. ${result.reachable_count} of ${result.prospect_count} can be emailed.`,
      )
      list.refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not read that file.",
      )
    } finally {
      setImporting(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  async function handleRemove(prospect: OutreachProspect) {
    try {
      await outreachService.removeProspect(runId, prospect.id)
      list.refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove them.")
    }
  }

  const reachable = list.items.filter((p) => p.reachable).length

  return (
    <StepFrame
      title="Who are you writing to?"
      blurb="Upload a spreadsheet of people, or of companies. A company domain on its own is enough — anyone without an email address stays on the list but is never written for."
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept={SPREADSHEET_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
        <Button
          onClick={() => fileInput.current?.click()}
          disabled={importing}
        >
          <Upload className="size-4" />
          {importing ? "Reading…" : "Upload a spreadsheet"}
        </Button>
        {(list.total ?? 0) > 0 && (
          <p className="text-sm text-muted-foreground">
            <Users className="mr-1 inline size-4" />
            {list.total} on the list
            {reachable < list.items.length && (
              <> · {reachable} on this page can be emailed</>
            )}
          </p>
        )}
      </div>

      <DataState
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        emptyMessage="Nobody on the list yet. Upload a spreadsheet to get started."
        onRetry={list.refetch}
      >
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell className="font-medium">
                    {prospect.full_name ||
                      [prospect.first_name, prospect.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {prospect.job_title || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {prospect.company_name || prospect.company_domain || "—"}
                  </TableCell>
                  <TableCell>
                    {prospect.reachable ? (
                      prospect.email
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        No address
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${prospect.full_name ?? "prospect"}`}
                      onClick={() => void handleRemove(prospect)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
          onPrev={() => list.setPage((p) => Math.max(0, p - 1))}
          onNext={() => list.setPage((p) => p + 1)}
        />
      </DataState>
    </StepFrame>
  )
}
