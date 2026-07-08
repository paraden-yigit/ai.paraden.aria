import { useCallback } from "react"
import { ArrowRight } from "lucide-react"

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
  onContinue: () => void
}

/**
 * Review the uploaded companies and contacts (expandable rows). Only shown after
 * a CSV was uploaded and mapped. Continues to the discovery step.
 */
export function StepReview({ campaignId, onContinue }: StepReviewProps) {
  const fetchReview = useCallback(
    () => campaignUploadService.review(campaignId),
    [campaignId],
  )
  const { data, loading, error, refetch } = useAsync(fetchReview, [campaignId])

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
