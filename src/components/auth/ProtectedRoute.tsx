import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/features/auth/useAuth"

/** Guards routes that require a session; sends visitors to aria's own /login. */
export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
