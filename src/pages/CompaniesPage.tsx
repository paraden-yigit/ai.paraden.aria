import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { CompaniesTable } from "@/features/companies/CompaniesTable"
import { CompanyForm } from "@/features/companies/CompanyForm"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { companyService } from "@/services/company.service"
import { ApiError } from "@/services/http"
import type { Company, CompanyCreate } from "@/types/company"

export function CompaniesPage() {
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
  } = usePaginatedList<Company>(companyService.list)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCreate(payload: CompanyCreate) {
    setCreating(true)
    try {
      await companyService.create(payload)
      toast.success(`Company "${payload.name}" created.`)
      setCreateOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create company.")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!companyToDelete) return
    setDeleting(true)
    try {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage your companies.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New company
        </Button>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={companies.length === 0}
        emptyMessage="No companies yet."
        onRetry={refetch}
      >
        <CompaniesTable companies={companies} onDelete={setCompanyToDelete} />
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
          <DialogHeader>
            <DialogTitle>New company</DialogTitle>
            <DialogDescription>Add a company to your list.</DialogDescription>
          </DialogHeader>
          <CompanyForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={creating}
            submitLabel="Create company"
          />
        </DialogContent>
      </Dialog>

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
    </div>
  )
}
