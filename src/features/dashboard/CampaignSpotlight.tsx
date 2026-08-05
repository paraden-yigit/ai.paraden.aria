import { Link } from "react-router-dom"
import { ArrowRight, Megaphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Dashboard hero: what the most recent campaign has prepared, at a glance.
 *
 * Stubbed while campaigns are rebuilt. The old version fetched the newest
 * campaign and showed its company / people / reachable counts; it was wired
 * entirely to the removed campaign model, so rather than leave a broken import
 * this holds the slot and says what is happening.
 *
 * To restore: fetch the newest campaign and its contact stats again, and put the
 * three stat tiles back in `CardContent`.
 */
export function CampaignSpotlight() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Campaigns</CardDescription>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Megaphone className="size-5 text-muted-foreground" aria-hidden="true" />
          Being rebuilt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The engine that writes the emails is unchanged and fully tested. The
          workflow around it — building a list, choosing an approach, launching —
          is being put back together.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild>
          <Link to="/campaigns">
            Go to campaigns
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
