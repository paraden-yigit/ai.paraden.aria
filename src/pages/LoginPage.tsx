import LoginForm from "@/features/auth/LoginForm"
import { AuthScreen } from "@/features/auth/AuthScreen"
import { config } from "@/lib/config"

/** Login screen. The shell it sits in is shared with the password-reset pages. */
export function LoginPage() {
  return (
    <AuthScreen
      title="Welcome back."
      subtitle="Log in to the ARIA platform."
      alt={
        <>
          Don&apos;t have access yet?{" "}
          <a href={`${config.marketingUrl}/#waitlist`}>Join the waitlist</a>
        </>
      }
    >
      <LoginForm />
    </AuthScreen>
  )
}
