import { Link } from "react-router-dom"
import { Megaphone, MessageSquareText, Package, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SetupChecklist } from "@/features/onboarding/SetupChecklist"
import { useSetupState } from "@/features/onboarding/useSetupState"
import { useAuth } from "@/features/auth/useAuth"

export function DashboardPage() {
  const { user } = useAuth()
  const setup = useSetupState()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{user?.full_name ? `, ${user.full_name}` : ""}.
        </h1>
        <p className="text-muted-foreground">
          {setup.loading
            ? "You're signed in to Paraden ARIA."
            : setup.allDone
              ? "You're all set. What would you like to do?"
              : "Let's get ARIA working for you."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {setup.allDone ? (
            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>
                  Jump back into the things you use most.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/campaigns/new">
                    <Plus className="size-4" />
                    New campaign
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/campaigns">
                    <Megaphone className="size-4" />
                    Campaigns
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/products">
                    <Package className="size-4" />
                    Products
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/company/brand-profile">
                    <MessageSquareText className="size-4" />
                    Brand profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <SetupChecklist state={setup} />
          )}
        </div>

        <Card className="h-fit">
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
