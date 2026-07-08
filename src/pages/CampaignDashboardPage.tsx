import { Link } from "react-router-dom"
import { Package } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime } from "@/lib/format"
import { useCampaignContext } from "@/features/campaigns/useCampaignContext"

export function CampaignDashboardPage() {
  const { campaign } = useCampaignContext()

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

        {campaign.product_id != null ? (
          <Link to={`/products/${campaign.product_id}`} className="block">
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="size-4" />
                  Product
                </CardTitle>
                <CardDescription>The product this campaign promotes</CardDescription>
              </CardHeader>
              <CardContent className="text-sm font-medium text-foreground">
                {campaign.product_name ?? "—"}
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4" />
                Product
              </CardTitle>
              <CardDescription>The product this campaign promotes</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No product linked.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
