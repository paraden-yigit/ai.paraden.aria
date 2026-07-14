import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/features/auth/useAuth"

/**
 * Guards routes behind a permission. Pass a single key, or an array meaning
 * "any of these". If the current user's role grants none of them, redirect to
 * the dashboard (the page is also hidden from the sidebar). Permission-driven —
 * never checks the role name. Assumes it renders inside <ProtectedRoute>, so a
 * session already exists.
 */
export function RequirePermission({
  permission,
}: {
  permission: string | string[]
}) {
  const { hasPermission } = useAuth()
  const keys = Array.isArray(permission) ? permission : [permission]

  if (!keys.some(hasPermission)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
