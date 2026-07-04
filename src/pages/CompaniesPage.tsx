import { useCallback, useEffect, useRef, useState } from "react"
import { Plus, Search, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CompaniesTable } from "@/features/companies/CompaniesTable"
import { AddCompanyFlow } from "@/features/companies/AddCompanyFlow"
import { ImportDialog } from "@/features/import/ImportDialog"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { useAsync } from "@/hooks/useAsync"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useRowSelection } from "@/hooks/useRowSelection"
import { companyService } from "@/services/company.service"
import { contactService } from "@/services/contact.service"
import { ApiError } from "@/services/http"
import { parseSpreadsheet, type SpreadsheetRow } from "@/lib/spreadsheet"
import type { Company } from "@/types/company"

const getCompanyId = (company: Company) => company.id

export function CompaniesPage() {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  // Search when there's a query, otherwise list; refetch when the query changes.
  const fetchCompanies = useCallback(
    (params: { skip?: number; limit?: number }) =>
      debouncedQuery
        ? companyService.search(debouncedQuery, params)
        : companyService.list(params),
    [debouncedQuery],
  )

  const {
    items: companies,
    total,
    page,
    setPage,
    skip,
    hasNextPage,
    loading,
    error,
    refetch,
  } = usePaginatedList<Company>(fetchCompanies, { deps: [debouncedQuery] })

  const [createOpen, setCreateOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Multi-select + bulk delete.
  const selection = useRowSelection<Company>(getCompanyId)
  const { clear: clearSelection } = selection
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  // Selection is per-page; reset it when the page or search changes.
  useEffect(() => clearSelection(), [page, debouncedQuery, clearSelection])

  // A broader company list (beyond the current page) to de-dupe against on import.
  const loadAllCompanies = useCallback(() => companyService.list({ limit: 200 }), [])
  const { data: companyList } = useAsync(loadAllCompanies, [])
  const existingCompanies: Company[] = companyList?.items ?? []

  // Import flow: pick a CSV/XLSX file, then map its columns in a dialog.
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<{
    id: number
    name: string
    columns: string[]
    rows: SpreadsheetRow[]
  } | null>(null)

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so re-selecting the same file fires onChange again.
    event.target.value = ""
    if (!file) return
    try {
      const { columns, rows } = await parseSpreadsheet(file)
      setImportFile({ id: Date.now(), name: file.name, columns, rows })
      setImportOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read that file.")
    }
  }

  // A company can only be deleted once it has no contacts.
  async function companyHasContacts(id: number): Promise<boolean> {
    const res = await contactService.list(id, { limit: 1 })
    return res.items.length > 0
  }

  async function handleDelete() {
    if (!companyToDelete) return
    setDeleting(true)
    try {
      if (await companyHasContacts(companyToDelete.id)) {
        toast.error(
          `Delete ${companyToDelete.name}'s contacts before deleting the company.`,
        )
        setCompanyToDelete(null)
        return
      }
      await companyService.remove(companyToDelete.id)
      toast.success(`Company "${companyToDelete.name}" deleted.`)
      setCompanyToDelete(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete company.")
    } finally {
      setDeleting(false)
    }
  }

  async function handleBulkDelete() {
    const targets = selection.items
    if (targets.length === 0) return
    setBulkDeleting(true)
    try {
      // Companies that still have contacts can't be deleted — flag them instead.
      const checks = await Promise.all(
        targets.map(async (company) => ({
          company,
          blocked: await companyHasContacts(company.id).catch(() => false),
        })),
      )
      const blocked = checks.filter((c) => c.blocked).map((c) => c.company)
      const deletable = checks.filter((c) => !c.blocked).map((c) => c.company)

      const results = await Promise.allSettled(
        deletable.map((company) => companyService.remove(company.id)),
      )
      const failed = results.filter((r) => r.status === "rejected").length
      const deleted = deletable.length - failed

      if (deleted > 0) {
        toast.success(`Deleted ${deleted} ${deleted === 1 ? "company" : "companies"}.`)
      }
      if (blocked.length > 0) {
        toast.error(
          `Delete contacts first: ${blocked.map((c) => c.name).join(", ")}.`,
        )
      }
      if (failed > 0) {
        toast.error(`Failed to delete ${failed} ${failed === 1 ? "company" : "companies"}.`)
      }

      selection.clear()
      setBulkOpen(false)
      refetch()
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
        <p className="text-muted-foreground">Manage your companies.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, domain, country, or description…"
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {selection.count > 0 && (
            <Button variant="destructive" onClick={() => setBulkOpen(true)}>
              <Trash2 className="size-4" />
              Delete selected ({selection.count})
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="hidden"
            onChange={handleFileSelected}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
            Import
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add company
          </Button>
        </div>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={companies.length === 0}
        emptyMessage={
          debouncedQuery
            ? `No companies match “${debouncedQuery}”.`
            : "No companies yet."
        }
        onRetry={refetch}
      >
        <CompaniesTable
          companies={companies}
          onDelete={setCompanyToDelete}
          isSelected={selection.isSelected}
          onToggle={selection.toggle}
          headerState={selection.headerState(companies)}
          onToggleAll={(checked) => selection.toggleAll(companies, checked)}
        />
        <PaginationFooter
          page={page}
          skip={skip}
          count={companies.length}
          total={total}
          hasNextPage={hasNextPage}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </DataState>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <AddCompanyFlow
            existingCompanies={existingCompanies}
            onClose={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {importFile && (
        <ImportDialog
          key={importFile.id}
          open={importOpen}
          onOpenChange={setImportOpen}
          fileName={importFile.name}
          columns={importFile.columns}
          rows={importFile.rows}
          existingCompanies={existingCompanies}
          onImported={refetch}
        />
      )}

      <ConfirmDialog
        open={companyToDelete !== null}
        onOpenChange={(open) => !open && setCompanyToDelete(null)}
        title="Delete company?"
        description={
          companyToDelete
            ? `This will permanently delete "${companyToDelete.name}". This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={(open) => !open && setBulkOpen(false)}
        title={`Delete ${selection.count} ${selection.count === 1 ? "company" : "companies"}?`}
        description="This permanently deletes the selected companies. Companies that still have contacts will be skipped — delete their contacts first. This action cannot be undone."
        confirmLabel="Delete selected"
        destructive
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </div>
  )
}
