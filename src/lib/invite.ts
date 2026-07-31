import { toast } from "sonner"

import { config } from "./config"
import { ApiError } from "@/services/http"
import { userService } from "@/services/user.service"
import type { ClientUser } from "@/types/user"

/** Build the invitation (set-password) link for a pending user, or null. */
export function inviteLink(
  user: Pick<ClientUser, "invitation_token">,
): string | null {
  if (!user.invitation_token) return null
  // The set-password page lives on the marketing site at /invite/<token>.
  return `${config.marketingUrl}/invite/${user.invitation_token}`
}

/** Whether the user still has an invitation to copy or re-send. */
export function isPendingInvite(
  user: Pick<ClientUser, "status" | "invitation_token">,
) {
  return user.status === "pending" && Boolean(user.invitation_token)
}

/**
 * What the invite toasts say about the email, plus a one-tap copy action.
 *
 * The API emails the link itself, so the interesting part is whether that
 * actually happened — `invitation_email_sent` is false when sending is off or
 * the send failed, and then the link has to be passed along by hand. The copy
 * action stays either way.
 */
function inviteToastOptions(user: ClientUser) {
  const link = inviteLink(user)
  return {
    description: user.invitation_email_sent
      ? `Invitation email sent to ${user.email}.`
      : "No email was sent — share the invite link so they can set their password.",
    ...(link && {
      action: {
        label: "Copy link",
        onClick: () => void navigator.clipboard.writeText(link),
      },
    }),
  }
}

/** Success toast after creating a user. */
export function notifyUserCreated(user: ClientUser) {
  if (!inviteLink(user)) {
    toast.success(`Invitation sent to ${user.email}.`)
    return
  }
  toast.success(`Invitation sent to ${user.email}.`, inviteToastOptions(user))
}

/**
 * Issue a fresh invitation for a pending user and email it again.
 *
 * Returns the updated user (with its new token), or null if it failed. Note this
 * **invalidates the previous link** — that is the point of a re-send, but it
 * means any copy of the old link already shared stops working.
 */
export async function resendInvitation(
  user: ClientUser,
): Promise<ClientUser | null> {
  try {
    const updated = await userService.regenerateInvitation(user.id)
    toast.success("Invitation re-sent.", inviteToastOptions(updated))
    return updated
  } catch (err) {
    toast.error(
      err instanceof ApiError ? err.message : "Failed to re-send the invitation.",
    )
    return null
  }
}
