import { TagInput } from "@/components/form/TagInput"
import { INDUSTRIES } from "@/features/companies/industries"
import { placeService } from "@/services/place.service"
import type { OutreachIcpDraft } from "@/types/outreach"
import { CompanySizeRange } from "./CompanySizeRange"
import { ProfileField } from "./ProfileField"
import { StepFrame } from "./StepFrame"

/** Defined out here so the reference is stable — `TagInput` keys both its
 * lookup and its response cache on it. */
const findPlaces = (query: string, signal: AbortSignal) =>
  placeService.suggest(query, signal)

interface StepCompaniesProps {
  value: OutreachIcpDraft
  onChange: (next: OutreachIcpDraft) => void
}

/**
 * The company half of a Flow run's profile: which companies to look inside.
 *
 * Asked before the people because it is the coarser cut — the same job title
 * means something different at a fifty-person agency and a fifty-thousand-person
 * bank. Nothing here is prefilled from the product's own ICP; a run is a
 * decision about this campaign.
 */
export function StepCompanies({ value, onChange }: StepCompaniesProps) {
  function set<K extends keyof OutreachIcpDraft>(
    key: K,
    next: OutreachIcpDraft[K],
  ) {
    onChange({ ...value, [key]: next })
  }

  return (
    <StepFrame
      title="Which companies should we look inside?"
      blurb="The coarse cut. Broaden a field to reach more companies; narrow it for a closer match. Leave one empty and it simply does not filter."
    >
      <ProfileField
        label="Industry"
        description="The sectors those companies operate in. Start typing to see the sectors we can match."
      >
        {({ id, describedBy }) => (
          <TagInput
            id={id}
            aria-describedby={describedBy}
            value={value.industries}
            onChange={(next) => set("industries", next)}
            suggestions={INDUSTRIES}
            placeholder="Search industries…"
          />
        )}
      </ProfileField>
      <ProfileField
        label="Company location"
        description="Where the company itself is based. Start typing and pick from the list — a country on its own works, or a city within one."
      >
        {({ id, describedBy }) => (
          <TagInput
            id={id}
            aria-describedby={describedBy}
            value={value.company_locations}
            onChange={(next) => set("company_locations", next)}
            fetchSuggestions={findPlaces}
            placeholder="Germany"
          />
        )}
      </ProfileField>
      <ProfileField
        label="Company size"
        description="How many people they employ. The scale is fine at the small end, where the difference actually matters; left at 0–300,000+ it does not filter at all."
      >
        {({ id }) => (
          <CompanySizeRange
            id={id}
            min={value.headcount_min}
            max={value.headcount_max}
            onChange={(range) =>
              onChange({
                ...value,
                headcount_min: range.min,
                headcount_max: range.max,
              })
            }
          />
        )}
      </ProfileField>
    </StepFrame>
  )
}
