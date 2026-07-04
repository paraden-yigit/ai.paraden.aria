import { useState } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DescriptionList } from "@/components/DescriptionList"
import { CampaignForm } from "@/features/campaigns/CampaignForm"
import { campaignService } from "@/services/campaign.service"
import { ApiError } from "@/services/http"
import { formatDateTime } from "@/lib/format"
import { useCampaignContext } from "@/features/campaigns/useCampaignContext"
import type { CampaignCreate } from "@/types/campaign"

export function CampaignInfoPage() {
  const { campaign, refetch } = useCampaignContext()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave(payload: CampaignCreate) {
    setSaving(true)
    try {
      // Only the name is editable for now.
      await campaignService.update(campaign.id, { name: payload.name })
      toast.success("Campaign information updated.")
      setEditing(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update campaign.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Campaign Info</h2>
        <p className="text-muted-foreground">
          View and update your campaign information.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{campaign.name}</CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <CampaignForm
              campaign={campaign}
              onSubmit={handleSave}
              onCancel={() => setEditing(false)}
              submitting={saving}
              submitLabel="Save changes"
            />
          ) : (
            <DescriptionList
              items={[
                { label: "Name", value: campaign.name },
                { label: "Created", value: formatDateTime(campaign.created_at) },
                { label: "Last updated", value: formatDateTime(campaign.updated_at) },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
