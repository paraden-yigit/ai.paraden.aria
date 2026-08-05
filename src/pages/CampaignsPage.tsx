import { Megaphone } from "lucide-react"

/**
 * Placeholder while campaigns are rebuilt.
 *
 * The old campaign feature has been removed; the new one is being built against
 * the extracted generation service. This keeps the route and the nav entry alive
 * so the app shell stays coherent in the meantime — there is nothing here to
 * interact with yet, and saying so plainly beats an empty page that reads as a
 * loading failure.
 */
export function CampaignsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
      <Megaphone className="size-8 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">Campaigns are being rebuilt</p>
        <p className="max-w-md text-sm text-muted-foreground">
          The outreach engine that writes the emails is unchanged. The workflow
          around it — building a list, choosing an approach, launching — is being
          put back together and will appear here.
        </p>
      </div>
    </div>
  )
}
