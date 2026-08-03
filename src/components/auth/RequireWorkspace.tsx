import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/features/auth/useAuth"

/**
 * Gates the app behind having a workspace to be in.
 *
 * Every "no tenant" case funnels through here, so nothing further in has to
 * know the state exists: pages below can read `activeWorkspace` without a null
 * check, and the API's own 409 for the same condition should never be reached
 * from the UI. Assumes it renders inside `<ProtectedRoute>`.
 */
export function RequireWorkspace() {
  const { activeWorkspace, isInitializing } = useAuth()

  if (isInitializing) return null
  if (!activeWorkspace) return <Navigate to="/workspaces" replace />
  return <Outlet />
}
