import "@/features/auth/login.css"
import LoginForm from "@/features/auth/LoginForm"
import { config } from "@/lib/config"

/**
 * Login screen — markup and styling copied from the marketing site (ai.paraden).
 * Everything is scoped under `.login-page` so the dark theme stays on this route.
 */
export function LoginPage() {
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
            <h1>Welcome back.</h1>
            <p>Log in to the ARIA platform.</p>
          </div>

          <LoginForm />

          <div className="secure-note" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
              <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
            </svg>
            Encrypted in transit. Authenticated access only.
          </div>

          <p className="auth-alt">
            Don&apos;t have access yet?{" "}
            <a href={`${config.marketingUrl}/#waitlist`}>Join the waitlist</a>
          </p>
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
