import { Link } from "react-router-dom"
import { ClipboardList, Info } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime } from "@/lib/format"
import { useCampaignContext } from "@/features/campaigns/useCampaignContext"

// The campaign-brief fields, used to show how much of the brief is filled in.
const BRIEF_FIELDS = [
  "offering",
  "audience",
  "problem_solved",
  "buyer_challenges",
  "proof_points",
  "buyer_outcome",
  "winning_emails",
  "supporting_data",
  "email_approver",
] as const

export function CampaignDashboardPage() {
  const { campaign } = useCampaignContext()

  const answered = BRIEF_FIELDS.filter((key) => {
    const value = campaign[key]
    return typeof value === "string" && value.trim() !== ""
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">An overview of this campaign.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Campaign details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>Created {formatDateTime(campaign.created_at)}</div>
            <div>Updated {formatDateTime(campaign.updated_at)}</div>
          </CardContent>
        </Card>

        <Link to="questions" className="block">
          <Card className="h-full transition-colors hover:bg-accent/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-4" />
                Brief
              </CardTitle>
              <CardDescription>Questions answered</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <span className="text-2xl font-semibold text-foreground">
                {answered}
              </span>{" "}
              / {BRIEF_FIELDS.length} answered
            </CardContent>
          </Card>
        </Link>

        <Link to="info" className="block">
          <Card className="h-full transition-colors hover:bg-accent/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-4" />
                Campaign Info
              </CardTitle>
              <CardDescription>Name &amp; details</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Edit the campaign name and details.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
