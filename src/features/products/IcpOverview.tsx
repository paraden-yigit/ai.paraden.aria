import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { composeIcpSummary } from "@/features/products/icpSummary"
import type { Icp } from "@/types/icp"

/** One read-only group of the profile: a friendly label, a hint, and chips. */
function OverviewGroup({
  label,
  hint,
  values,
}: {
  label: string
  hint: string
  values: string[]
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.length > 0 ? (
          values.map((v) => (
            <Badge key={v} variant="secondary" className="font-normal">
              {v}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">
            Not set. Searches stay broad here.
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * The readable face of the ICP: a plain-English summary first, then the
 * profile's contents as grouped chips. Editing happens in the separate
 * fine-tune form; this view is safe to browse.
 */
export function IcpOverview({ icp }: { icp: Icp }) {
  const sentences = composeIcpSummary(icp)
  const headcount =
    icp.headcount_min != null || icp.headcount_max != null
      ? [
          `${icp.headcount_min ?? "Any"} to ${icp.headcount_max ?? "any"} people`,
        ]
      : []

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">In plain terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {sentences.map((s) => (
            <p key={s} className="text-sm leading-relaxed">
              {s}
            </p>
          ))}
          <p className="pt-2 text-xs text-muted-foreground">
            This description updates as the profile changes.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">The companies we look for</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OverviewGroup
              label="Industries"
              hint="The sectors they operate in."
              values={icp.industries}
            />
            <OverviewGroup
              label="Size"
              hint="How many people work there."
              values={headcount}
            />
            <OverviewGroup
              label="Countries"
              hint="Where they are based."
              values={icp.countries}
            />
            <OverviewGroup
              label="Yearly revenue"
              hint="Roughly how much they make."
              values={icp.revenue_ranges}
            />
            <OverviewGroup
              label="Company types"
              hint="Ownership style, like privately held or public."
              values={icp.company_types}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">The people we contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OverviewGroup
              label="Seniority"
              hint="How senior they are."
              values={icp.seniority}
            />
            <OverviewGroup
              label="Departments"
              hint="Where in the company they work."
              values={icp.job_functions}
            />
            <OverviewGroup
              label="Specialisms"
              hint="Narrower roles within those departments."
              values={icp.job_subfunctions}
            />
            <OverviewGroup
              label="Themes"
              hint="Words that describe the companies we match."
              values={icp.keywords}
            />
            <OverviewGroup
              label="Specialties"
              hint="What those companies are good at."
              values={icp.specialties}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
