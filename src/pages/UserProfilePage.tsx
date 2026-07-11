import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { UserProfileForm } from "@/features/user-profile/UserProfileForm"
import { useAuth } from "@/features/auth/useAuth"
import { authService } from "@/services/auth.service"
import { ApiError } from "@/services/http"
import type { UserProfileUpdate } from "@/types/auth"

export function UserProfilePage() {
  // The current user is already bootstrapped into auth context; edits go through
  // PATCH /api/auth/me and refreshUser() updates the cached user in place.
  const { user, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)

  async function handleSave(payload: UserProfileUpdate) {
    setSaving(true)
    try {
      await authService.updateProfile(payload)
      await refreshUser()
      toast.success("Profile saved.")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save profile.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Your account details. How your emails sound and your signature live in{" "}
          <Link to="/email-settings" className="underline underline-offset-4">
            email settings
          </Link>
          .
        </p>
      </div>

      {user && (
        <Card>
          <CardContent className="pt-6">
            <UserProfileForm
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
