import { useState } from "react"
import { toast } from "sonner"

import { ProfileSettingsForm } from "@/features/user-profile/ProfileSettingsForm"
import { useAuth } from "@/features/auth/useAuth"
import { authService } from "@/services/auth.service"
import { ApiError } from "@/services/http"
import type { UserProfileUpdate } from "@/types/auth"

export function ProfileSettingsPage() {
  // The current user is already bootstrapped into auth context; edits go through
  // PATCH /api/auth/me and refreshUser() updates the cached user in place.
  const { user, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)

  async function handleSave(payload: UserProfileUpdate) {
    setSaving(true)
    try {
      await authService.updateProfile(payload)
      await refreshUser()
      toast.success("Profile settings saved.")
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to save profile settings.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Profile settings
        </h1>
        <p className="text-muted-foreground">
          Your profile picture, name, and the signature appended to every email
          ARIA writes for your campaigns.
        </p>
      </div>

      {user && (
        <ProfileSettingsForm
          // Remount with fresh defaults after a save updates the cached user.
          key={user.updated_at}
          user={user}
          onSubmit={handleSave}
          onAvatarUploaded={refreshUser}
          submitting={saving}
        />
      )}
    </div>
  )
}
