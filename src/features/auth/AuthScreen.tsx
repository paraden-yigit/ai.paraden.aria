import type { ReactNode } from "react"

import "@/features/auth/login.css"
import { config } from "@/lib/config"

interface AuthScreenProps {
  title: string
  subtitle: string
  /** The card: a form, a confirmation, whatever the screen is for. */
  children: ReactNode
  /** Optional line under the card (e.g. "Back to log in"). */
  alt?: ReactNode
}

/**
 * The shell every unauthenticated screen sits in — log in, forgot password,
 * choose a new password. Markup and styling are copied from the marketing site
 * and scoped under `.login-page`, so the dark theme stays on these routes.
 *
 * Shared so the password-reset screens are visibly the same product as the login
 * they interrupt; someone following a link out of their inbox should recognise
 * where they have landed.
 */
export function AuthScreen({ title, subtitle, children, alt }: AuthScreenProps) {
  return (
    <div className="login-page">
      <a className="skip-link" href="#auth">
        Skip to content
      </a>

      <header className="login-nav">
        <a href={config.marketingUrl} aria-label="Paraden home">
          <img
            className="login-nav-logo"
            src="/assets/paraden-wordmark-dark.svg"
            alt="Paraden"
          />
        </a>
      </header>

      <main className="login-main">
        <div className="auth" id="auth">
          <div className="auth-head">
            <div className="auth-eyebrow">Paraden ARIA</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {children}

          <div className="secure-note" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
              <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
            </svg>
            Encrypted in transit. Authenticated access only.
          </div>

          {alt && <p className="auth-alt">{alt}</p>}
        </div>
      </main>

      <footer className="login-foot">
        <span>© 2026 Paraden AI Ltd</span> &nbsp;·&nbsp;
        <a href={`${config.marketingUrl}/privacy`}>Privacy</a> &nbsp;·&nbsp;
        <a href={`${config.marketingUrl}/terms`}>Terms</a> &nbsp;·&nbsp;
        <a href={`${config.marketingUrl}/legal`}>Trust &amp; legal</a>
      </footer>
    </div>
  )
}
