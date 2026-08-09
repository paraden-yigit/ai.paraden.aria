import { useState } from "react"
import { Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CompanyUploadDialog } from "./CompanyUploadDialog"
import type { CampaignType, RunIcp } from "@/types/outreach"

const NUMBER = new Intl.NumberFormat("en-GB")

/** The size range in words. Null ends mean no floor and no ceiling, which is
 * "any size" rather than "0 to 0". */
function companySize(icp: RunIcp): string | null {
  const { headcount_min: min, headcount_max: max } = icp
  if (min == null && max == null) return null
  if (min != null && max != null)
    return `${NUMBER.format(min)}–${NUMBER.format(max)} employees`
  if (min != null) return `${NUMBER.format(min)}+ employees`
  return `Up to ${NUMBER.format(max as number)} employees`
}

function Field({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {values.length === 0 ? (
        // Said rather than left blank: an empty filter is a decision — it means
        // "do not narrow on this" — and a gap on the page reads as missing data.
        <p className="text-sm text-muted-foreground">Not narrowed</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="rounded-md px-2.5 py-1 text-sm font-normal"
            >
              {value}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * What the campaign was aimed at, as it was set up.
 *
 * A record, not an editor. The profile is what the pool was counted from and
 * what the emails were calibrated against, so changing it here would quietly
 * describe a campaign that never ran.
 */
export function CampaignIcp({
  runId,
  icp,
  campaignType,
}: {
  runId: number
  icp: RunIcp | null
  campaignType: CampaignType | null
}) {
  const [uploading, setUploading] = useState(false)
  const strategic = campaignType === "strategic"
  if (!icp) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No profile was saved with this campaign.
        </p>
      </div>
    )
  }

  const size = companySize(icp)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* A Strategic campaign has no company profile to show — its companies
        * were named, not described — so this says where they came from and
        * offers the only thing that can change them. */}
      <section className="space-y-5 rounded-xl border p-6">
        <div>
          <h2 className="font-semibold">The companies</h2>
          <p className="text-sm text-muted-foreground">
            {strategic
              ? "You choose these. They were uploaded as a list of domains rather than described by a profile, so there is nothing here to tune — add more and the campaign reaches further."
              : "What the pool is drawn from."}
          </p>
        </div>

        {strategic ? (
          <>
            <Button variant="outline" onClick={() => setUploading(true)}>
              <Plus className="size-4" />
              Upload more companies
            </Button>
            <p className="text-xs text-muted-foreground">
              A spreadsheet of domains, or pasted straight in. They are added to
              the list on the Companies tab.
            </p>
            <CompanyUploadDialog
              runId={runId}
              open={uploading}
              onOpenChange={setUploading}
              onUploaded={() => setUploading(false)}
            />
          </>
        ) : (
          <>
            <Field label="Industry" values={icp.industries} />
            <Field label="Company location" values={icp.company_locations} />
            <div className="space-y-2">
              <p className="text-sm font-medium">Company size</p>
              <p className="text-sm text-muted-foreground">
                {size ?? "Any size"}
              </p>
            </div>
          </>
        )}
      </section>

      <section className="space-y-5 rounded-xl border p-6">
        <div>
          <h2 className="font-semibold">The people</h2>
          <p className="text-sm text-muted-foreground">
            Who at those companies the outreach was written for.
          </p>
        </div>
        <Field label="Department" values={icp.departments} />
        <Field label="Job titles" values={icp.job_titles} />
        <Field label="Seniority" values={icp.seniority} />
        <Field label="Location" values={icp.locations} />
      </section>
    </div>
  )
}
