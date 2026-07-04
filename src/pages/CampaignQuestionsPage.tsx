import { useState } from "react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { CampaignBriefForm } from "@/features/campaigns/CampaignBriefForm"
import { campaignService } from "@/services/campaign.service"
import { ApiError } from "@/services/http"
import { useCampaignContext } from "@/features/campaigns/useCampaignContext"
import type { CampaignUpdate } from "@/types/campaign"

export function CampaignQuestionsPage() {
  const { campaign, refetch } = useCampaignContext()

  const [saving, setSaving] = useState(false)

  async function handleSave(payload: CampaignUpdate) {
    setSaving(true)
    try {
      await campaignService.update(campaign.id, payload)
      toast.success("Campaign saved.")
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save campaign.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Questions</h2>
        <p className="text-muted-foreground">
          The campaign brief — these answers are used to generate this campaign's
          outreach.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CampaignBriefForm
            campaign={campaign}
            onSubmit={handleSave}
            submitting={saving}
          />
        </CardContent>
      </Card>
    </div>
  )
}
