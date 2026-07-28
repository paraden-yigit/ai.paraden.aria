import LoginForm from "@/features/auth/LoginForm"
import { AuthScreen } from "@/features/auth/AuthScreen"
import { config } from "@/lib/config"

/** Login screen. The shell it sits in is shared with the password-reset pages. */
export function LoginPage() {
  return (
    <AuthScreen
      title="Welcome back."
      subtitle="Log in to Paraden."
      alt={
        <>
          Don&apos;t have access yet?{" "}
          {/* The marketing root, not /contact: this ships independently of the
              site rewrite, and the root is valid against both the old and new
              site. Point it at /contact once that branch is merged. */}
          <a href={config.marketingUrl}>Book a demo</a>
        </>
      }
    >
      <LoginForm />
    </AuthScreen>
  )
}
