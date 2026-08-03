import { useCallback, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { AuthScreen } from "@/features/auth/AuthScreen"
import { CreateAccountForm } from "@/features/invitations/CreateAccountForm"
import { InvitationCard } from "@/features/invitations/InvitationCard"
import { useAuth } from "@/features/auth/useAuth"
import { useAsync } from "@/hooks/useAsync"
import { invitationService } from "@/services/invitation.service"
import { ApiError } from "@/services/http"

/**
 * The page an invitation link opens — one route, whatever state it is in.
 *
 * Deliberately outside both route guards. A signed-out visitor has to reach it
 * (they may have no account at all) and so does a signed-in one, so neither
 * `ProtectedRoute` nor `PublicOnlyRoute` can own it. Keeping it as one URL means
 * the link already sitting in someone's inbox never has to change, and every
 * branch below is reached by the same click:
 *
 * 1. invalid, expired, or already answered → say which.
 * 2. signed out, account exists           → sign in, then come back here.
 * 3. signed out, no account               → create one, then come back here.
 * 4. signed in as the invitee             → accept or decline.
 * 5. signed in as someone else            → refuse, and offer the way out.
 */
export function InvitationPage() {
  const { token = "" } = useParams()
  const { user, isAuthenticated, isInitializing, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const fetcher = useCallback(() => invitationService.get(token), [token])
  const { data: invitation, loading, error, refetch } = useAsync(fetcher, [token])

  if (isInitializing || loading) return null

  if (error || !invitation) {
    return (
      <AuthScreen
        title="Invitation unavailable."
        subtitle="This link can no longer be used."
        alt={
          <>
            Need a new one? <a href="mailto:support@paraden.ai">Contact support</a>
          </>
        }
      >
        <div className="card">
          <div className="form-note err" role="alert" style={{ display: "block" }}>
            {error ?? "This invitation link is invalid or has expired."}
          </div>
        </div>
      </AuthScreen>
    )
  }

  // (1) Answered or lapsed — nothing to do but explain.
  if (invitation.status !== "pending") {
    const explanation: Record<string, string> = {
      accepted: "This invitation has already been accepted.",
      declined: "This invitation was declined.",
      revoked: "This invitation was withdrawn.",
      expired: "This invitation has expired.",
    }
    return (
      <AuthScreen
        title="Nothing to answer."
        subtitle={`Your invitation to ${invitation.workspace_name}.`}
        alt={
          isAuthenticated ? (
            <a href="/">Go to Paraden</a>
          ) : (
            <a href="/login">Log in</a>
          )
        }
      >
        <div className="card">
          <div className="form-note" role="status" style={{ display: "block" }}>
            {explanation[invitation.status] ?? "This invitation is no longer open."}
          </div>
        </div>
      </AuthScreen>
    )
  }

  // (2) They have an account. Send them to sign in and bring them back here —
  // LoginForm already knows how to return to an intercepted route.
  if (!isAuthenticated && invitation.account_exists) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: { pathname: `/invite/${token}` },
          notice: `Sign in as ${invitation.email} to view your invitation.`,
        }}
      />
    )
  }

  // (3) No account yet. Creating one signs them in; it does not join them to
  // anything, so they land back here with something still to decide.
  if (!isAuthenticated) {
    return (
      <AuthScreen
        title="Create your account."
        subtitle={`${invitation.invited_by_name ?? "Someone"} invited ${invitation.email} to ${invitation.workspace_name}.`}
      >
        <CreateAccountForm
          token={token}
          email={invitation.email}
          onCreated={async () => {
            await refreshUser()
            refetch()
          }}
        />
      </AuthScreen>
    )
  }

  // (5) Signed in as somebody else. Never auto-accept and never auto-logout —
  // and never offer Decline, because refusing on another person's behalf is not
  // this visitor's to do.
  if (user && user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <AuthScreen
        title="Wrong account."
        subtitle={`This invitation is for ${invitation.email}.`}
      >
        <div className="card">
          <div className="form-note err" role="alert" style={{ display: "block" }}>
            You're signed in as {user.email}.
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true)
              await logout()
              // Back to this same link, now signed out, which lands on (2)/(3).
              navigate(`/invite/${token}`, { replace: true })
              setSubmitting(false)
            }}
          >
            <span>Sign out and continue</span> <span className="arrow">→</span>
          </button>
          <p className="auth-alt">
            <a href="/">Stay signed in as {user.email}</a>
          </p>
        </div>
      </AuthScreen>
    )
  }

  // (4) The invitee, signed in. The actual decision.
  return (
    <AuthScreen
      title="You've been invited."
      subtitle={`Join ${invitation.workspace_name} on Paraden.`}
    >
      <InvitationCard
        invitation={invitation}
        submitting={submitting}
        onAccept={async () => {
          setSubmitting(true)
          try {
            await invitationService.accept(token)
            // Accepting switched the session into the workspace, so refreshing
            // is what makes the app render inside it.
            await refreshUser()
            toast.success(`You've joined ${invitation.workspace_name}.`)
            navigate("/", { replace: true })
          } catch (err) {
            toast.error(
              err instanceof ApiError ? err.message : "Couldn't accept this invitation.",
            )
            setSubmitting(false)
          }
        }}
        onDecline={async () => {
          setSubmitting(true)
          try {
            await invitationService.decline(token)
            await refreshUser()
            toast.success(`Declined the invitation to ${invitation.workspace_name}.`)
            refetch()
          } catch (err) {
            toast.error(
              err instanceof ApiError ? err.message : "Couldn't decline this invitation.",
            )
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </AuthScreen>
  )
}
