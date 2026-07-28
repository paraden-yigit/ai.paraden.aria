import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/features/auth/useAuth"
import { ApiError } from "@/services/http"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LoginState {
  from?: { pathname?: string }
  /** One-off message from wherever we were sent here (e.g. a password reset). */
  notice?: string
}

/*
  Login form for the aria dashboard. Authenticates directly against the platform
  API (POST /api/auth/login), which sets the httpOnly session cookies; we then
  load the user and route into the app. Markup/styling are copied from the
  marketing site's login. Email + password only — Google sign-in is still a
  placeholder-free absence (see git history).
*/
export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginState | null
  const from = state?.from?.pathname ?? "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  // Seeded once from the navigation state, so the "password changed" line shows
  // on arrival and then clears the moment the user does anything else.
  const [info, setInfo] = useState(state?.notice ?? "")

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
            <Link className="forgot" to="/forgot-password" id="forgotLink">
              Forgot?
            </Link>
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
