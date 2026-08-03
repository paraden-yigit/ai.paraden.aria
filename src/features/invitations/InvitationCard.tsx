import { roleLabel } from "@/lib/roles"
import type { Invitation } from "@/types/invitation"

/**
 * Accept or decline, with enough on screen to decide.
 *
 * Which workspace, as what, on whose team, at whose invitation — the four things
 * that tell a real invitation apart from one sent to the wrong address. Decline
 * is a plain link rather than a second button: it is the rarer answer, and the
 * pair reads better when the page isn't asking equally hard for both.
 */
export function InvitationCard({
  invitation,
  submitting,
  onAccept,
  onDecline,
}: {
  invitation: Invitation
  submitting: boolean
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <div className="card">
      <dl className="invite-summary">
        <div>
          <dt>Workspace</dt>
          <dd>{invitation.workspace_name}</dd>
        </div>
        <div>
          <dt>Your role</dt>
          <dd>{roleLabel(invitation.role)}</dd>
        </div>
        {invitation.team_name && (
          <div>
            <dt>Team</dt>
            <dd>{invitation.team_name}</dd>
          </div>
        )}
        {invitation.invited_by_name && (
          <div>
            <dt>Invited by</dt>
            <dd>{invitation.invited_by_name}</dd>
          </div>
        )}
      </dl>

      <button
        type="button"
        className="btn-primary"
        disabled={submitting}
        onClick={onAccept}
      >
        <span>{submitting ? "Joining…" : "Accept invitation"}</span>{" "}
        <span className="arrow">→</span>
      </button>

      <p className="auth-alt">
        <button
          type="button"
          className="link-button"
          disabled={submitting}
          onClick={onDecline}
        >
          Decline
        </button>
      </p>
    </div>
  )
}
