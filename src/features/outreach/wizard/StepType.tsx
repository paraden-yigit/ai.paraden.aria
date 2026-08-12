import { cn } from "@/lib/utils"
import { CAMPAIGN_TYPES, type CampaignType } from "../campaignTypes"
import { StepFrame } from "./StepFrame"

/**
 * The type step — how the campaign runs, and so how its list is built.
 *
 * Asked before the list step because it decides what that step *is*: a
 * Strategic run is a list you upload, a Flow run is a pool we keep filled from
 * an ideal customer profile.
 */
export function StepType({
  value,
  onChange,
}: {
  value: CampaignType | null
  onChange: (type: CampaignType) => void
}) {
  return (
    <StepFrame
      title="How should this campaign run?"
      blurb="This sets where the contacts come from and how long the campaign keeps going. It can't be changed once the run starts."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {CAMPAIGN_TYPES.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-lg border p-5 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/40",
              )}
            >
              <option.icon className="size-6" aria-hidden />
              <p className="mt-6 font-semibold">{option.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {option.description}
              </p>
            </button>
          )
        })}
      </div>
    </StepFrame>
  )
}
