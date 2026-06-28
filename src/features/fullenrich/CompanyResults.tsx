import { Building2, ExternalLink, MapPin, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  FullEnrichCompany,
  FullEnrichLocation,
  FullEnrichSearchMetadata,
} from "@/types/fullenrich"

function formatLocation(loc?: FullEnrichLocation): string | null {
  if (!loc) return null
  const parts = [loc.city, loc.region, loc.country].filter(Boolean)
  return parts.length ? parts.join(", ") : null
}

function CompanyCard({ company }: { company: FullEnrichCompany }) {
  const hq = formatLocation(company.locations?.headquarters)
  const linkedin = company.social_profiles?.professional_network?.url
  const industry = company.industry?.main_industry
  const headcount =
    company.headcount != null
      ? company.headcount.toLocaleString()
      : company.headcount_range

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            {company.name ?? "Unknown company"}
          </CardTitle>
          {company.domain && (
            <a
              href={`https://${company.domain}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {company.domain}
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {company.description && (
          <p className="text-muted-foreground line-clamp-4">{company.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {industry && <Badge variant="secondary">{industry}</Badge>}
          {company.company_type && (
            <Badge variant="outline">{company.company_type}</Badge>
          )}
          {company.year_founded != null && (
            <Badge variant="outline">Founded {company.year_founded}</Badge>
          )}
          {company.revenue_range && (
            <Badge variant="outline">{company.revenue_range}</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          {headcount && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {headcount} employees
            </span>
          )}
          {hq && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {hq}
            </span>
          )}
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              LinkedIn
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        {company.specialties && company.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {company.specialties.slice(0, 12).map((s) => (
              <Badge key={s} variant="secondary" className="font-normal">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CompanyResultsProps {
  companies: FullEnrichCompany[]
  metadata?: FullEnrichSearchMetadata
}

export function CompanyResults({ companies, metadata }: CompanyResultsProps) {
  return (
    <div className="space-y-4">
      {metadata && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {metadata.total != null && (
            <span>
              <span className="font-medium text-foreground">
                {metadata.total.toLocaleString()}
              </span>{" "}
              results
            </span>
          )}
          {metadata.credits != null && <span>{metadata.credits} credits</span>}
        </div>
      )}
      {companies.map((company, i) => (
        <CompanyCard key={company.id ?? `${company.domain}-${i}`} company={company} />
      ))}
    </div>
  )
}
