import { Navigate, Outlet } from "react-router-dom"
import { Clock } from "lucide-react"

import { useAuth } from "@/features/auth/useAuth"
import { OnboardingHeader } from "@/features/onboarding/wizard/OnboardingHeader"

/**
 * Gates the authenticated app behind first-login onboarding.
 *
 * Per workspace, not per person: someone can be fully set up in one and waiting
 * on an owner in another, and switching between them switches this too.
 *
 * - Workspace already onboarded → render the app (`<Outlet/>`).
 * - Not onboarded + owner → send them into the onboarding wizard.
 * - Not onboarded + anyone else → they can't use it yet; show a short "being
 *   set up" screen until the owner finishes.
 */
export function OnboardingGate() {
  const { activeWorkspace } = useAuth()

  // RequireWorkspace guarantees one here; be defensive anyway.
  if (!activeWorkspace || activeWorkspace.onboarding_completed) {
    return <Outlet />
  }

  if (activeWorkspace.role === "owner") {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <OnboardingHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="max-w-md space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Clock className="size-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Your workspace is being set up
          </h1>
          <p className="text-sm text-muted-foreground">
            Your company owner is finishing onboarding. You'll have access as soon
            as it's done — check back shortly.
          </p>
        </div>
      </main>
    </div>
  )
}
