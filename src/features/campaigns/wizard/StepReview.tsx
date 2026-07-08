import { useCallback, useState } from "react"
import { Building2, Check, ChevronDown, ChevronRight, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataState } from "@/components/DataState"
import { cn } from "@/lib/utils"
import { useAsync } from "@/hooks/useAsync"
import { campaignUploadService } from "@/services/campaign-upload.service"
import type {
  CampaignCompanyReview,
  CampaignUploadedContact,
} from "@/types/campaign-upload"

interface StepReviewProps {
  campaignId: number
  skippedUpload: boolean
  onFinish: () => void
}

/**
 * Step 4 — review the uploaded companies and contacts. Companies are listed as
 * expandable rows; expanding one reveals its contacts. When the upload step was
 * skipped, there's nothing to review.
 */
export function StepReview({ campaignId, skippedUpload, onFinish }: StepReviewProps) {
  const fetchReview = useCallback(
    () => campaignUploadService.review(campaignId),
    [campaignId],
  )
  const { data, loading, error, refetch } = useAsync(fetchReview, [campaignId])

  if (skippedUpload) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Users className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No contacts uploaded</p>
          <p className="text-xs text-muted-foreground">
            You skipped the upload step. You can add contacts to this campaign
            later.
          </p>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onFinish}>
            <Check className="size-4" />
            Finish
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DataState
        loading={loading}
        error={error}
        isEmpty={
          !!data &&
          data.companies.length === 0 &&
          data.unassigned_contacts.length === 0
        }
        emptyMessage="No contacts were imported."
        onRetry={refetch}
      >
        {data && (
          <>
            <p className="text-sm text-muted-foreground">
              Imported{" "}
              <span className="font-medium text-foreground">
                {data.total_contacts} contacts
              </span>{" "}
              across{" "}
              <span className="font-medium text-foreground">
                {data.total_companies} companies
              </span>
              . Expand a company to see its contacts.
            </p>

            <div className="divide-y rounded-lg border">
              {data.companies.map((company) => (
                <CompanyRow key={company.id} company={company} />
              ))}
            </div>

            {data.unassigned_contacts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Contacts without a company ({data.unassigned_contacts.length})
                </p>
                <div className="rounded-lg border">
                  <ContactsTable contacts={data.unassigned_contacts} />
                </div>
              </div>
            )}
          </>
        )}
      </DataState>

      <div className="flex justify-end">
        <Button type="button" onClick={onFinish}>
          <Check className="size-4" />
          Finish
        </Button>
      </div>
    </div>
  )
}

function CompanyRow({ company }: { company: CampaignCompanyReview }) {
  const [open, setOpen] = useState(false)
  const subtitle = [company.domain, company.industry].filter(Boolean).join(" · ")

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <Building2 className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {company.name || company.domain || "Unnamed company"}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0">
          {company.contacts.length}{" "}
          {company.contacts.length === 1 ? "contact" : "contacts"}
        </Badge>
      </button>
      {open && (
        <div className={cn("border-t bg-muted/20")}>
          <ContactsTable contacts={company.contacts} />
        </div>
      )}
    </div>
  )
}

function ContactsTable({ contacts }: { contacts: CampaignUploadedContact[] }) {
  if (contacts.length === 0) {
    return (
      <p className="p-3 text-xs text-muted-foreground">No contacts.</p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Job title</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">LinkedIn</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-t">
              <td className="px-3 py-2">{contact.full_name || "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {contact.job_title || "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {contact.email || "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {contact.linkedin_url ? (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Profile
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
