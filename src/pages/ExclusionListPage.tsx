import { useCallback, useState } from "react"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ExcludedCompaniesTable } from "@/features/excluded-companies/ExcludedCompaniesTable"
import { ExcludedCompanyForm } from "@/features/excluded-companies/ExcludedCompanyForm"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { excludedCompanyService } from "@/services/excluded-company.service"
import { ApiError } from "@/services/http"
import type {
  ExcludedCompany,
  ExcludedCompanyCreate,
} from "@/types/excluded-company"

export function ExclusionListPage() {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  // Search when there's a query, otherwise list; refetch when the query changes.
  const fetchCompanies = useCallback(
    (params: { skip?: number; limit?: number }) =>
      debouncedQuery
        ? excludedCompanyService.search(debouncedQuery, params)
        : excludedCompanyService.list(params),
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
  } = usePaginatedList<ExcludedCompany>(fetchCompanies, { deps: [debouncedQuery] })

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [companyToEdit, setCompanyToEdit] = useState<ExcludedCompany | null>(null)
  const [saving, setSaving] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<ExcludedCompany | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCreate(payload: ExcludedCompanyCreate) {
    setCreating(true)
    try {
      await excludedCompanyService.create(payload)
      toast.success(`"${payload.name}" added to the exclusion list.`)
      setCreateOpen(false)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to add company.",
      )
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(payload: ExcludedCompanyCreate) {
    if (!companyToEdit) return
    setSaving(true)
    try {
      await excludedCompanyService.update(companyToEdit.id, payload)
      toast.success(`"${payload.name}" updated.`)
      setCompanyToEdit(null)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update company.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!companyToDelete) return
    setDeleting(true)
    try {
      await excludedCompanyService.remove(companyToDelete.id)
      toast.success(`"${companyToDelete.name}" removed from the exclusion list.`)
      setCompanyToDelete(null)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to remove company.",
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exclusion List</h1>
        <p className="text-muted-foreground">
          Companies to exclude from your outreach.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, domain, or LinkedIn URL…"
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="sm:ml-auto">
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
            ? `No excluded companies match “${debouncedQuery}”.`
            : "No companies on the exclusion list yet. Anyone you add here is left out of every campaign, always."
        }
        emptyAction={
          debouncedQuery ? undefined : (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add a company
            </Button>
          )
        }
        onRetry={refetch}
      >
        <ExcludedCompaniesTable
          companies={companies}
          onEdit={setCompanyToEdit}
          onDelete={setCompanyToDelete}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add company to exclusion list</DialogTitle>
            <DialogDescription>
              A company needs a name plus a domain or a LinkedIn URL. Adding it
              removes any matching company and its contacts from your company
              list and from every campaign.
            </DialogDescription>
          </DialogHeader>
          <ExcludedCompanyForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={creating}
            submitLabel="Add company"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={companyToEdit !== null}
        onOpenChange={(open) => !open && setCompanyToEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit excluded company</DialogTitle>
            <DialogDescription>Update this company's details.</DialogDescription>
          </DialogHeader>
          {companyToEdit && (
            <ExcludedCompanyForm
              company={companyToEdit}
              onSubmit={handleUpdate}
              onCancel={() => setCompanyToEdit(null)}
              submitting={saving}
              submitLabel="Save changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={companyToDelete !== null}
        onOpenChange={(open) => !open && setCompanyToDelete(null)}
        title="Remove from exclusion list?"
        description={
          companyToDelete
            ? `This will remove "${companyToDelete.name}" from the exclusion list. This action cannot be undone.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
