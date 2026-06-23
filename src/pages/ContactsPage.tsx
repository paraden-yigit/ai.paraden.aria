import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ContactForm } from "@/features/companies/ContactForm"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { useAsync } from "@/hooks/useAsync"
import { contactService } from "@/services/contact.service"
import { companyService } from "@/services/company.service"
import { ApiError } from "@/services/http"
import type { Company } from "@/types/company"
import type { ContactCreate, ContactWithCompany } from "@/types/contact"

export function ContactsPage() {
  const navigate = useNavigate()
  const {
    items: contacts,
    total,
    page,
    setPage,
    skip,
    hasNextPage,
    loading,
    error,
    refetch,
  } = usePaginatedList<ContactWithCompany>(contactService.listAll)

  // Companies for the "New contact" picker (a contact must belong to a company).
  const loadCompanies = useCallback(() => companyService.list({ limit: 200 }), [])
  const { data: companyList } = useAsync(loadCompanies, [])
  const companies: Company[] = companyList?.items ?? []

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [companyId, setCompanyId] = useState("")
  const [toDelete, setToDelete] = useState<ContactWithCompany | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCreate(payload: ContactCreate) {
    if (!companyId) {
      toast.error("Pick a company for this contact.")
      return
    }
    setCreating(true)
    try {
      await contactService.create(Number(companyId), payload)
      toast.success(`Contact "${payload.full_name}" created.`)
      setCreateOpen(false)
      setCompanyId("")
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create contact.")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await contactService.remove(toDelete.company_id, toDelete.id)
      toast.success(`Contact "${toDelete.full_name}" deleted.`)
      setToDelete(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete contact.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">People across all your companies.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={companies.length === 0}>
          <Plus className="size-4" />
          New contact
        </Button>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={contacts.length === 0}
        emptyMessage="No contacts yet. Add one here, or find them from a company's Contacts tab."
        onRetry={refetch}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Seniority</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/companies/${contact.company_id}/contacts/${contact.id}`,
                    )
                  }
                >
                  <TableCell className="font-medium">{contact.full_name}</TableCell>
                  <TableCell>{contact.job_title || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.company_name}
                  </TableCell>
                  <TableCell>{contact.seniority || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[contact.city, contact.country].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(
                              `/companies/${contact.company_id}/contacts/${contact.id}`,
                            )
                          }
                        >
                          <Eye className="size-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setToDelete(contact)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <PaginationFooter
          page={page}
          skip={skip}
          count={contacts.length}
          total={total}
          hasNextPage={hasNextPage}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </DataState>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New contact</DialogTitle>
            <DialogDescription>
              Add a contact and assign it to one of your companies.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company</label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a company…" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ContactForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={creating}
            submitLabel="Create contact"
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete contact?"
        description={
          toDelete
            ? `This will permanently delete "${toDelete.full_name}". This action cannot be undone.`
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
