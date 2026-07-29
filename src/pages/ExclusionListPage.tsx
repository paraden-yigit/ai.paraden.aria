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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ExcludedCompaniesTable } from "@/features/excluded-companies/ExcludedCompaniesTable"
import { ExcludedCompanyForm } from "@/features/excluded-companies/ExcludedCompanyForm"
import { ExcludedDomainsForm } from "@/features/excluded-companies/ExcludedDomainsForm"
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

  async function handleCreateMany(domains: string[]) {
    setCreating(true)
    try {
      const result = await excludedCompanyService.createMany(domains)
      // Report every line back: added, already there, or not a domain. A paste
      // that half-worked is the case worth being explicit about.
      const parts = [`Added ${result.created.length} domains.`]
      if (result.skipped_existing.length > 0) {
        parts.push(`${result.skipped_existing.length} already on the list.`)
      }
      if (result.invalid.length > 0) {
        parts.push(
          `Skipped ${result.invalid.length} line(s) that aren't domains: ${result.invalid
            .slice(0, 3)
            .join(", ")}${result.invalid.length > 3 ? "…" : ""}`,
        )
      }
      const message = parts.join(" ")
      if (result.created.length > 0) toast.success(message)
      else toast.warning(message)
      setCreateOpen(false)
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to add domains.",
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
        <h1 className="text-2xl font-semibold tracking-tight">Exclusion list</h1>
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
            <DialogTitle>Add to exclusion list</DialogTitle>
            <DialogDescription>
              Anything you add here is removed from your campaigns — the company,
              its contacts, and anyone whose work email is at that domain.
            </DialogDescription>
          </DialogHeader>
          {/* Two ways in, because they answer different questions: "exclude this
              one company I know about" and "exclude this list I was handed". */}
          <Tabs defaultValue="single">
            <TabsList className="w-full">
              <TabsTrigger value="single">One company</TabsTrigger>
              <TabsTrigger value="bulk">Paste domains</TabsTrigger>
            </TabsList>
            <TabsContent value="single" className="pt-4">
              <ExcludedCompanyForm
                onSubmit={handleCreate}
                onCancel={() => setCreateOpen(false)}
                submitting={creating}
                submitLabel="Add company"
              />
            </TabsContent>
            <TabsContent value="bulk" className="pt-4">
              <ExcludedDomainsForm
                onSubmit={handleCreateMany}
                onCancel={() => setCreateOpen(false)}
                submitting={creating}
              />
            </TabsContent>
          </Tabs>
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
