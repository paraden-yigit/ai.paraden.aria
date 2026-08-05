import { Link } from "react-router-dom"
import { Briefcase, Megaphone, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CampaignSpotlight } from "@/features/dashboard/CampaignSpotlight"
import { KnowledgeMeter } from "@/features/dashboard/KnowledgeMeter"
import { PerformanceStrip } from "@/features/dashboard/PerformanceStrip"
import { SampleCharts } from "@/features/dashboard/SampleCharts"
import { SetupChecklist } from "@/features/onboarding/SetupChecklist"
import { useSetupState } from "@/features/onboarding/useSetupState"
import { useAuth } from "@/features/auth/useAuth"
import { roleLabel } from "@/lib/roles"

function AccountCard() {
  const { user } = useAuth()
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Your account</CardTitle>
        <CardDescription>Session active</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <div>{user?.email}</div>
        {user?.active_workspace && (
          <div>
            {user.active_workspace.name} · {roleLabel(user.active_workspace.role)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>
          Jump back into the things you use most.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {/* "New campaign" is gone with the wizard — a button leading to a
            removed route is worse than one fewer button. Restore it when the
            new campaign flow lands. */}
        <Button asChild>
          <Link to="/products">
            <Package className="size-4" />
            Products
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/campaigns">
            <Megaphone className="size-4" />
            Campaigns
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/workspace">
            <Briefcase className="size-4" />
            Company info
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const setup = useSetupState()

  // No campaign list while campaigns are rebuilt. PerformanceStrip renders
  // nothing on an empty set, so the results band collapses on its own rather
  // than showing a funnel of zeros.
  const campaigns: never[] = []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{user?.display_name ? `, ${user.display_name}` : ""}.
        </h1>
        <p className="text-muted-foreground">
          {setup.loading
            ? "You're signed in to Paraden."
            : setup.allDone
              ? "Here's where your outreach stands."
              : "Let's get Paraden working for you."}
        </p>
      </div>

      {setup.allDone ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* The results band leads (funnel totals, then the two trend
                charts), followed by the actionable spotlight, then the
                campaign sections. */}
            <PerformanceStrip campaigns={campaigns} />
            <SampleCharts />
            <CampaignSpotlight />
          </div>
          <div className="space-y-6">
            <QuickActionsCard />
            <KnowledgeMeter setup={setup} />
            <AccountCard />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SetupChecklist state={setup} />
          </div>
          <AccountCard />
        </div>
      )}
    </div>
  )
}
