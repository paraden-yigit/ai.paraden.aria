import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/features/auth/useAuth"
import { ApiError } from "@/services/http"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FromState {
  from?: { pathname?: string }
}

/*
  Login form for the aria dashboard. Authenticates directly against the platform
  API (POST /api/auth/login), which sets the httpOnly session cookies; we then
  load the user and route into the app. Markup/styling are copied from the
  marketing site's login. Email + password only: Google sign-in and a real
  password-reset flow arrive with backend support (the removed placeholders
  live in git history), so the screen promises nothing it cannot do.
*/
export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as FromState | null)?.from?.pathname ?? "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setInfo("")
    if (!EMAIL_RE.test(email.trim()) || password.length < 1) {
      setError("Enter a valid work email and your password.")
      return
    }
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Invalid email or password."
          : err instanceof ApiError
            ? err.message
            : "We could not reach the server. Please try again shortly.",
      )
      setSubmitting(false)
    }
  }

  function handleForgot(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    setError("")
    setInfo("Password help: email support@paraden.ai and we will sort it out.")
  }

  return (
    <div className="card">
      <form id="loginForm" onSubmit={handleSubmit} noValidate>
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
            required
          />
        </div>
        <div className="field">
          <div className="field-row">
            <label htmlFor="password">Password</label>
            <a className="forgot" href="#" id="forgotLink" onClick={handleForgot}>
              Forgot?
            </a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          <span id="submitLabel">{submitting ? "Checking…" : "Log in"}</span>{" "}
          <span className="arrow">→</span>
        </button>
        <div
          className="form-note err"
          id="loginErr"
          role="alert"
          style={{ display: error ? "block" : "none" }}
        >
          {error}
        </div>
        <div
          className="form-note info"
          id="loginInfo"
          role="status"
          style={{ display: info ? "block" : "none" }}
        >
          {info}
        </div>
      </form>
    </div>
  )
}
