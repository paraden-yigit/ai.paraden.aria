import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Eye,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
  UserSearch,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { DataState } from "@/components/DataState"
import { PaginationFooter } from "@/components/PaginationFooter"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ContactForm } from "@/features/companies/ContactForm"
import { usePaginatedList } from "@/hooks/usePaginatedList"
import { contactService } from "@/services/contact.service"
import { ApiError } from "@/services/http"
import type { Company } from "@/types/company"
import type { Contact, ContactCreate } from "@/types/contact"

export function ContactsTab({ company }: { company: Company }) {
  const navigate = useNavigate()
  const fetcher = useCallback(
    (params: { skip?: number; limit?: number }) =>
      contactService.list(company.id, params),
    [company.id],
  )
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
  } = usePaginatedList<Contact>(fetcher, { deps: [company.id] })

  const [finding, setFinding] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState(false)
  const canFind = Boolean(company.domain || company.linkedin_url)

  async function handleFind() {
    setFinding(true)
    try {
      const { found } = await contactService.find(company.id)
      toast.success(
        found > 0
          ? `Found ${found} contact${found === 1 ? "" : "s"}.`
          : "No contacts found for this company.",
      )
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to find contacts.")
    } finally {
      setFinding(false)
    }
  }

  async function handleCreate(payload: ContactCreate) {
    setCreating(true)
    try {
      await contactService.create(company.id, payload)
      toast.success(`Contact "${payload.full_name}" created.`)
      setCreateOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create contact.")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!contactToDelete) return
    setDeleting(true)
    try {
      await contactService.remove(company.id, contactToDelete.id)
      toast.success(`Contact "${contactToDelete.full_name}" deleted.`)
      setContactToDelete(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete contact.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            People at this company. Add manually or find them via FullEnrich.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Span wrapper so the tooltip still fires while the button is
                  disabled (a disabled button receives no pointer events). */}
              <span className="inline-flex" tabIndex={!canFind ? 0 : undefined}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFind}
                  disabled={!canFind || finding}
                >
                  {finding ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserSearch className="size-4" />
                  )}
                  {finding ? "Finding…" : "Find contacts"}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {canFind
                ? "Find people at this company via FullEnrich"
                : "Add a domain or LinkedIn URL to find contacts"}
            </TooltipContent>
          </Tooltip>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New contact
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataState
          loading={loading}
          error={error}
          isEmpty={contacts.length === 0}
          emptyMessage="No contacts yet — add one, or click “Find contacts” to pull them from FullEnrich."
          onRetry={refetch}
        >
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Seniority</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-12" />
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`/companies/${company.id}/contacts/${contact.id}`)
                    }
                  >
                    <TableCell className="font-medium">{contact.full_name}</TableCell>
                    <TableCell>{contact.job_title || "—"}</TableCell>
                    <TableCell>{contact.seniority || "—"}</TableCell>
                    <TableCell>{contact.department || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[contact.city, contact.country].filter(Boolean).join(", ") ||
                        "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {contact.linkedin_url && (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          title="Open LinkedIn profile"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      )}
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
                                `/companies/${company.id}/contacts/${contact.id}`,
                              )
                            }
                          >
                            <Eye className="size-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setContactToDelete(contact)}
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
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New contact</DialogTitle>
            <DialogDescription>Add a contact to {company.name}.</DialogDescription>
          </DialogHeader>
          <ContactForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitting={creating}
            submitLabel="Create contact"
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={contactToDelete !== null}
        onOpenChange={(open) => !open && setContactToDelete(null)}
        title="Delete contact?"
        description={
          contactToDelete
            ? `This will permanently delete "${contactToDelete.full_name}". This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </Card>
  )
}
