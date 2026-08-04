import { Info } from "lucide-react"

import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** A field label with an info tooltip beside it. Used by the wizard steps that
 * ask the user to size a search, so the hint text sits out of the way of the
 * form rather than as a second line under every input. */
export function LabelWithHint({
  htmlFor,
  label,
  hint,
}: {
  htmlFor: string
  label: string
  hint: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label={hint}
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{hint}</TooltipContent>
      </Tooltip>
    </div>
  )
}
