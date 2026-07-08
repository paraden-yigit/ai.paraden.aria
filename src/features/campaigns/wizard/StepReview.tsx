import { useCallback } from "react"
import { ArrowRight, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataState } from "@/components/DataState"
import { useAsync } from "@/hooks/useAsync"
import { campaignUploadService } from "@/services/campaign-upload.service"
import {
  CompaniesAccordion,
  ContactsTable,
} from "@/features/campaigns/wizard/CompaniesAccordion"

interface StepReviewProps {
  campaignId: number
  skippedUpload: boolean
  onContinue: () => void
}

/**
 * Review the uploaded companies and contacts (expandable rows). When the upload
 * step was skipped there's nothing to review. Continues to the discovery step.
 */
export function StepReview({ campaignId, skippedUpload, onContinue }: StepReviewProps) {
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
            You skipped the upload step. You can still find new contacts next.
          </p>
        </div>
        <StepFooter onContinue={onContinue} />
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

            <CompaniesAccordion companies={data.companies} />

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

      <StepFooter onContinue={onContinue} />
    </div>
  )
}

function StepFooter({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex justify-end">
      <Button type="button" onClick={onContinue}>
        Continue
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}
