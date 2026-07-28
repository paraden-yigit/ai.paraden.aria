import { useState } from "react"
import { Link } from "react-router-dom"

import { AuthScreen } from "@/features/auth/AuthScreen"
import { authService } from "@/services/auth.service"
import { ApiError } from "@/services/http"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * "Forgot password" — asks for an address and has the API email a reset link.
 *
 * The confirmation deliberately does not say whether the address had an account:
 * the API answers the same either way, and a screen that said "no such user"
 * would turn this form into a way to test which addresses are Paraden customers.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter the work email you log in with.")
      return
    }
    setSubmitting(true)
    try {
      await authService.requestPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We could not reach the server. Please try again shortly.",
      )
      setSubmitting(false)
    }
  }

  const backToLogin = <Link to="/login">Back to log in</Link>

  if (sent) {
    return (
      <AuthScreen
        title="Check your inbox."
        subtitle="If that email has a Paraden account, a reset link is on its way."
        alt={backToLogin}
      >
        <div className="card">
          <div className="form-note info" role="status" style={{ display: "block" }}>
            We sent a link to <strong>{email.trim()}</strong>. It expires in an
            hour and can only be used once.
          </div>
          <p className="auth-alt" style={{ marginTop: 18 }}>
            Nothing arrived? Check your spam folder, or{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setSent(false)
                setSubmitting(false)
              }}
            >
              try a different address
            </a>
            .
          </p>
        </div>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      title="Forgot your password?"
      subtitle="Enter your work email and we'll send you a reset link."
      alt={backToLogin}
    >
      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            <span>{submitting ? "Sending…" : "Send reset link"}</span>{" "}
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
