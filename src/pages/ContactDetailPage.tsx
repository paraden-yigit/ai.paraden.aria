import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Pencil, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { DescriptionList } from "@/components/DescriptionList"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ContactForm } from "@/features/companies/ContactForm"
import { useAsync } from "@/hooks/useAsync"
import { contactService } from "@/services/contact.service"
import { ApiError } from "@/services/http"
import { formatDateTime } from "@/lib/format"
import type { Contact, ContactCreate } from "@/types/contact"

const POLL_INTERVAL_MS = 4000
const MAX_POLLS = 23 // ~90s before we tell the user to check back later

// FullEnrich statuses that mean the job will never finish.
const TERMINAL_FAILURE = new Set([
  "CANCELED",
  "CREDITS_INSUFFICIENT",
  "RATE_LIMIT",
  "UNKNOWN",
])

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ContactDetailPage() {
  const { companyId, contactId } = useParams<{
    companyId: string
    contactId: string
  }>()
  const cId = Number(companyId)
  const ctId = Number(contactId)

  const navigate = useNavigate()
  const fetcher = useCallback(() => contactService.get(cId, ctId), [cId, ctId])
  const { data: contact, loading, error, refetch } = useAsync(fetcher, [cId, ctId])

  const [enriching, setEnriching] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // Stop polling if the user navigates away mid-enrichment.
  const cancelled = useRef(false)
  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  async function handleSave(payload: ContactCreate) {
    setSaving(true)
    try {
      await contactService.update(cId, ctId, payload)
      toast.success("Contact updated.")
      setEditing(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update contact.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await contactService.remove(cId, ctId)
      toast.success("Contact deleted.")
      navigate(`/companies/${cId}`, { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete contact.")
      setDeleting(false)
    }
  }

  const canEnrich = Boolean(
    contact && (contact.linkedin_url || (contact.first_name && contact.last_name)),
  )

  async function handleEnrich() {
    setEnriching(true)
    try {
      const { enrichment_id } = await contactService.startEnrich(cId, ctId)
      for (let i = 0; i < MAX_POLLS; i++) {
        if (cancelled.current) return
        const { status, contact: updated } = await contactService.pollEnrich(
          cId,
          ctId,
          enrichment_id,
        )
        if (status === "FINISHED") {
          await refetch()
          toast.success(
            updated.email
              ? `Work email found: ${updated.email}`
              : "Enrichment finished, but no work email was found.",
          )
          return
        }
        if (TERMINAL_FAILURE.has(status)) {
          toast.error(`Enrichment didn't complete (${status}).`)
          return
        }
        await sleep(POLL_INTERVAL_MS)
      }
      toast.message("Still enriching — check back in a moment.")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to enrich contact.")
    } finally {
      if (!cancelled.current) setEnriching(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={`/companies/${cId}`}>
          <ArrowLeft className="size-4" />
          Back to company
        </Link>
      </Button>

      <DataState
        loading={loading}
        error={error}
        isEmpty={!contact}
        emptyMessage="Contact not found."
        onRetry={refetch}
      >
        {contact && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {contact.full_name}
                </h1>
                <p className="text-muted-foreground">{contact.job_title ?? "—"}</p>
              </div>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contact information</CardTitle>
                {!editing && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEnrich}
                      disabled={!canEnrich || enriching}
                      title={
                        canEnrich
                          ? "Find this contact's work email via FullEnrich"
                          : "Needs a LinkedIn URL, or a first and last name"
                      }
                    >
                      {enriching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      {enriching ? "Enriching…" : "Enrich contact"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {editing ? (
                  <ContactForm
                    contact={contact}
                    onSubmit={handleSave}
                    onCancel={() => setEditing(false)}
                    submitting={saving}
                  />
                ) : (
                  <DescriptionList items={describe(contact)} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delete contact</CardTitle>
                <CardDescription>
                  Permanently remove this contact. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" />
                  Delete contact
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </DataState>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete contact?"
        description={
          contact
            ? `This will permanently delete "${contact.full_name}". This action cannot be undone.`
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

function describe(contact: Contact) {
  return [
    { label: "Full name", value: contact.full_name },
    { label: "First name", value: contact.first_name },
    { label: "Last name", value: contact.last_name },
    { label: "Job title", value: contact.job_title },
    { label: "Seniority", value: contact.seniority },
    { label: "Department", value: contact.department },
    {
      label: "Work email",
      value: contact.email ? (
        <a
          href={`mailto:${contact.email}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          {contact.email}
        </a>
      ) : null,
    },
    { label: "Phone", value: contact.phone },
    {
      label: "LinkedIn",
      value: contact.linkedin_url ? (
        <a
          href={contact.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          {contact.linkedin_url}
        </a>
      ) : null,
    },
    { label: "City", value: contact.city },
    { label: "Region", value: contact.region },
    { label: "Country", value: contact.country },
    { label: "Created", value: formatDateTime(contact.created_at) },
    { label: "Updated", value: formatDateTime(contact.updated_at) },
  ]
}
