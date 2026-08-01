import { useState } from "react"

import { invitationService } from "@/services/invitation.service"
import { ApiError } from "@/services/http"

const MIN_LENGTH = 8

/**
 * Create the account an invitation is addressed to.
 *
 * The email is fixed and read-only: it comes from the invitation, which is what
 * stops a token being used to make an account for some other address. The name
 * is asked for here because this is the first moment the person themselves can
 * say what they are called — and it is what signs off every email they send.
 *
 * Styled with the shared `.login-page` classes rather than shadcn, so it sits
 * inside `AuthScreen` looking like the login it stands in for.
 */
export function CreateAccountForm({
  token,
  email,
  onCreated,
}: {
  token: string
  email: string
  onCreated: () => void | Promise<void>
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.")
      return
    }
    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)
    try {
      await invitationService.register(token, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
      })
      await onCreated()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't create your account. Please try again.",
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} autoComplete="username" readOnly />
        </div>
        <div className="field">
          <label htmlFor="first-name">First name</label>
          <input
            id="first-name"
            type="text"
            autoComplete="given-name"
            placeholder="Ada"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="last-name">Last name</label>
          <input
            id="last-name"
            type="text"
            autoComplete="family-name"
            placeholder="Lovelace"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_LENGTH} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          <span>{submitting ? "Creating account…" : "Create account"}</span>{" "}
          <span className="arrow">→</span>
        </button>
        <div
          className="form-note err"
          role="alert"
          style={{ display: error ? "block" : "none" }}
        >
          {error}
        </div>
      </form>
    </div>
  )
}
