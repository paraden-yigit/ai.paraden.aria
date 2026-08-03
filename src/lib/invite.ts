import { toast } from "sonner"

import { config } from "./config"
import { ApiError } from "@/services/http"
import { invitationService } from "@/services/invitation.service"
import type { WorkspaceInvitation } from "@/types/invitation"

/** The link an invitation is answered through. */
export function inviteLink(invitation: Pick<WorkspaceInvitation, "token">): string {
  return `${config.appUrl}/invite/${invitation.token}`
}

/** Whether this invitation can still be answered. */
export function isOpen(invitation: Pick<WorkspaceInvitation, "status">) {
  return invitation.status === "pending"
}

/**
 * What the invite toasts say, plus a one-tap copy.
 *
 * The API emails the link itself, so the interesting part is whether that
 * actually happened — `invitation_email_sent` is false when sending is off or
 * the send failed, and then the link has to be passed along by hand. The copy
 * action stays either way.
 */
function inviteToastOptions(invitation: WorkspaceInvitation) {
  const link = inviteLink(invitation)
  return {
    description: invitation.invitation_email_sent
      ? `Invitation email sent to ${invitation.email}.`
      : "No email was sent — share the invite link so they can accept it.",
    action: {
      label: "Copy link",
      onClick: () => void navigator.clipboard.writeText(link),
    },
  }
}

/** Success toast after inviting someone. */
export function notifyInvited(invitation: WorkspaceInvitation) {
  toast.success(
    `Invitation sent to ${invitation.email}.`,
    inviteToastOptions(invitation),
  )
}

/**
 * Issue a fresh invitation and email it again.
 *
 * Returns the new invitation, or null if it failed. Note this **invalidates the
 * previous link** — that is the point of a re-send, but it means any copy of the
 * old one already shared stops working.
 */
export async function resendInvitation(
  invitation: WorkspaceInvitation,
): Promise<WorkspaceInvitation | null> {
  try {
    const updated = await invitationService.resend(invitation.id)
    toast.success("Invitation re-sent.", inviteToastOptions(updated))
    return updated
  } catch (err) {
    toast.error(
      err instanceof ApiError ? err.message : "Failed to re-send the invitation.",
    )
    return null
  }
}
