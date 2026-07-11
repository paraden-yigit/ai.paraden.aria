import { useState } from "react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { EmailSettingsForm } from "@/features/user-profile/EmailSettingsForm"
import { useAuth } from "@/features/auth/useAuth"
import { authService } from "@/services/auth.service"
import { ApiError } from "@/services/http"
import type { UserProfileUpdate } from "@/types/auth"

export function EmailSettingsPage() {
  // The current user is already bootstrapped into auth context; edits go through
  // PATCH /api/auth/me and refreshUser() updates the cached user in place.
  const { user, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)

  async function handleSave(payload: UserProfileUpdate) {
    setSaving(true)
    try {
      await authService.updateProfile(payload)
      await refreshUser()
      toast.success("Email settings saved.")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save email settings.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email settings</h1>
        <p className="text-muted-foreground">
          How your outreach emails should sound and the signature appended to every
          email generated from campaigns you create.
        </p>
      </div>

      {user && (
        <Card>
          <CardContent className="pt-6">
            <EmailSettingsForm
              // Remount with fresh defaults after a save updates the cached user.
              key={user.updated_at}
              user={user}
              onSubmit={handleSave}
              submitting={saving}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
