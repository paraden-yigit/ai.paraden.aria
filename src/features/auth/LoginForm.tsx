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
  marketing site's login. Google sign-in / forgot-password remain placeholders
  until the backend supports them.
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

  function handleGoogle() {
    setError("")
    setInfo("Google sign-in will be available soon.")
  }

  function handleForgot(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    setError("")
    setInfo("Password help: email support@paraden.ai and we will sort it out.")
  }

  return (
    <div className="card">
      <button type="button" className="oauth" id="googleBtn" onClick={handleGoogle}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.6 39.6 16.2 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 35.8 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="divider">
        <span>or</span>
      </div>

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
        <label className="remember">
          <input type="checkbox" name="remember" /> Keep me signed in
        </label>
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
