import { useId, type ReactNode } from "react"

import { Label } from "@/components/ui/label"

/**
 * One labelled profile field with its own helper line.
 *
 * The child is a function so the field can own the ids and hand them to
 * whatever control it wraps — the label and the description stay wired to the
 * input without every caller inventing its own ids.
 */
export function ProfileField({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: (ids: { id: string; describedBy: string }) => ReactNode
}) {
  const id = useId()
  const describedBy = `${id}-description`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, describedBy })}
      <p id={describedBy} className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
