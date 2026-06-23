import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/features/auth/useAuth"

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{user?.full_name ? `, ${user.full_name}` : ""}.
        </h1>
        <p className="text-muted-foreground">You're signed in to Paraden ARIA.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Your account</CardTitle>
            <CardDescription>Session active</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>{user?.email}</div>
            {user?.client_id != null && <div>Client #{user.client_id}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
