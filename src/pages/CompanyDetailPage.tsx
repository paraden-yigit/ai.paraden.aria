import { useCallback, useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DataState } from "@/components/DataState"
import { DescriptionList } from "@/components/DescriptionList"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CompanyForm } from "@/features/companies/CompanyForm"
import { ContactsTab } from "@/features/companies/ContactsTab"
import { useAsync } from "@/hooks/useAsync"
import { companyService } from "@/services/company.service"
import { ApiError } from "@/services/http"
import { formatDateTime } from "@/lib/format"
import type { Company, CompanyCreate } from "@/types/company"

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const companyId = Number(id)
  const navigate = useNavigate()

  const fetcher = useCallback(() => companyService.get(companyId), [companyId])
  const { data: company, loading, error, refetch } = useAsync(fetcher, [companyId])

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleEnrich() {
    setEnriching(true)
    try {
      await companyService.enrich(companyId)
      toast.success("Company enriched.")
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to enrich company.")
    } finally {
      setEnriching(false)
    }
  }

  async function handleSave(payload: CompanyCreate) {
    setSaving(true)
    try {
      await companyService.update(companyId, payload)
      toast.success("Company updated.")
      setEditing(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update company.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await companyService.remove(companyId)
      toast.success("Company deleted.")
      navigate("/companies", { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete company.")
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/companies">
          <ArrowLeft className="size-4" />
          Back to companies
        </Link>
      </Button>

      <DataState
        loading={loading}
        error={error}
        isEmpty={!company}
        emptyMessage="Company not found."
        onRetry={refetch}
      >
        {company && (
          <>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
              <p className="text-muted-foreground">{company.domain}</p>
            </div>

            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Company info</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Company information</CardTitle>
                    {!editing && (() => {
                      const alreadyEnriched = company.enrich_status === "successful"
                      const canEnrich = Boolean(company.domain || company.linkedin_url)
                      const enrichDisabled = alreadyEnriched || !canEnrich || enriching
                      const enrichTooltip = alreadyEnriched
                        ? "This company is already enriched."
                        : canEnrich
                          ? "Fetch company data from FullEnrich"
                          : "Add a domain or LinkedIn URL to enable enrichment"
                      return (
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {/* Span wrapper so the tooltip still fires while the
                                button is disabled (no pointer events on it). */}
                            <span
                              className="inline-flex"
                              tabIndex={enrichDisabled ? 0 : undefined}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEnrich}
                                disabled={enrichDisabled}
                              >
                                {enriching ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Sparkles className="size-4" />
                                )}
                                {enriching
                                  ? "Enriching…"
                                  : alreadyEnriched
                                    ? "Enriched"
                                    : "Enrich"}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{enrichTooltip}</TooltipContent>
                        </Tooltip>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(true)}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                      </div>
                      )
                    })()}
                  </CardHeader>
                  <CardContent>
                    {editing ? (
                      <CompanyForm
                        company={company}
                        onSubmit={handleSave}
                        onCancel={() => setEditing(false)}
                        submitting={saving}
                      />
                    ) : (
                      <DescriptionList items={describe(company)} />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Delete company</CardTitle>
                    <CardDescription>
                      Permanently remove this company and all its data. This action
                      cannot be undone.
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
                      Delete company
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contacts" className="mt-4">
                <ContactsTab company={company} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DataState>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete company?"
        description={
          company
            ? `This will permanently delete "${company.name}". This action cannot be undone.`
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

function describe(company: Company) {
  return [
    { label: "Name", value: company.name },
    { label: "Domain", value: company.domain },
    { label: "Industry", value: company.industry },
    { label: "Company type", value: company.company_type },
    { label: "Headcount", value: company.headcount },
    { label: "Headcount range", value: company.headcount_range },
    { label: "Year founded", value: company.year_founded },
    {
      label: "LinkedIn",
      value: company.linkedin_url ? (
        <a
          href={company.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          {company.linkedin_url}
        </a>
      ) : null,
    },
    { label: "HQ city", value: company.hq_city },
    { label: "HQ region", value: company.hq_region },
    { label: "HQ country", value: company.hq_country },
    { label: "Description", value: company.description },
    { label: "Created", value: formatDateTime(company.created_at) },
    { label: "Updated", value: formatDateTime(company.updated_at) },
  ]
}
