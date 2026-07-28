import { useCallback, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { AuthScreen } from "@/features/auth/AuthScreen"
import { useAsync } from "@/hooks/useAsync"
import { authService } from "@/services/auth.service"
import { ApiError } from "@/services/http"

const MIN_PASSWORD_LENGTH = 8

/**
 * The page a password-reset link lands on: choose a new password.
 *
 * The link is validated before the form is shown, so an expired or already-used
 * one says so immediately rather than after someone has typed a password twice.
 * On success the user is sent to /login, which shows the confirmation — they
 * have to log in again anyway, since setting the password ends every session.
 */
export function ResetPasswordPage() {
  const { token = "" } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const check = useCallback(() => authService.checkPasswordReset(token), [token])
  const { data: info, loading, error: linkError } = useAsync(check, [token])

  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirmation) {
      setError("Both passwords must match.")
      return
    }
    setSubmitting(true)
    try {
      await authService.resetPassword(token, password)
      navigate("/login", {
        replace: true,
        state: { notice: "Your password has been changed. Log in to continue." },
      })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We could not reach the server. Please try again shortly.",
      )
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AuthScreen title="One moment." subtitle="Checking your reset link…">
        <div className="card">
          <div className="form-note info" role="status" style={{ display: "block" }}>
            Verifying…
          </div>
        </div>
      </AuthScreen>
    )
  }

  if (linkError || !info) {
    return (
      <AuthScreen
        title="This link no longer works."
        subtitle="Reset links are single-use and expire after an hour."
        alt={<Link to="/login">Back to log in</Link>}
      >
        <div className="card">
          <div className="form-note err" role="alert" style={{ display: "block" }}>
            {linkError ?? "This password reset link is invalid or has expired."}
          </div>
          <p className="auth-alt" style={{ marginTop: 18 }}>
            <Link to="/forgot-password">Request a new link</Link>
          </p>
        </div>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      title="Choose a new password."
      subtitle={`Setting a new password for ${info.email}.`}
      alt={<Link to="/login">Back to log in</Link>}
    >
      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmation">Confirm new password</label>
            <input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              placeholder="Type it again"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            <span>{submitting ? "Saving…" : "Set new password"}</span>{" "}
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
    </AuthScreen>
  )
}
