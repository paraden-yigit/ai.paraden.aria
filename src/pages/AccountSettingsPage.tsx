import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChangePasswordForm } from "@/features/user-profile/ChangePasswordForm"
import { useAuth } from "@/features/auth/useAuth"
import { authService } from "@/services/auth.service"
import { ApiError } from "@/services/http"
import { roleLabel } from "@/lib/roles"

export function AccountSettingsPage() {
  const { user, activeWorkspace } = useAuth()
  const [saving, setSaving] = useState(false)

  async function handleChangePassword(payload: {
    current_password: string
    new_password: string
  }) {
    setSaving(true)
    try {
      await authService.changePassword(payload)
      toast.success("Password updated.")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update password.",
      )
      // Re-throw so the form keeps the entered values on failure.
      throw err
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Account settings
        </h1>
        <p className="text-muted-foreground">
          Your account details and password. How your emails sound, your name and
          signature live in{" "}
          <Link to="/email-settings" className="underline underline-offset-4">
            email settings
          </Link>
          .
        </p>
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Role</p>
                <p className="text-sm text-muted-foreground">
                  {roleLabel(activeWorkspace?.role ?? "")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm
            onSubmit={handleChangePassword}
            submitting={saving}
          />
        </CardContent>
      </Card>
    </div>
  )
}
