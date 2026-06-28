import { useCallback, useState } from "react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { DataState } from "@/components/DataState"
import { BrandProfileForm } from "@/features/brand-profile/BrandProfileForm"
import { useAsync } from "@/hooks/useAsync"
import { brandProfileService } from "@/services/brand-profile.service"
import { ApiError } from "@/services/http"
import type { BrandProfileUpdate } from "@/types/brand-profile"

export function BrandProfilePage() {
  const loadProfile = useCallback(() => brandProfileService.get(), [])
  const { data: profile, loading, error, refetch } = useAsync(loadProfile, [])

  const [saving, setSaving] = useState(false)

  async function handleSave(payload: BrandProfileUpdate) {
    setSaving(true)
    try {
      await brandProfileService.save(payload)
      toast.success("Brand profile saved.")
      refetch()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save brand profile.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Brand Profile</h1>
        <p className="text-muted-foreground">
          Tell us about your company and how your outreach emails should sound. We
          use these answers when generating emails.
        </p>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={!profile}
        emptyMessage="No brand profile found."
        onRetry={refetch}
        skeletonRows={6}
      >
        {profile && (
          <Card>
            <CardContent className="pt-6">
              <BrandProfileForm
                profile={profile}
                onSubmit={handleSave}
                submitting={saving}
              />
            </CardContent>
          </Card>
        )}
      </DataState>
    </div>
  )
}
