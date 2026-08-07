import type { ReactNode } from "react"

/**
 * One wizard step's chrome: a heading, a sentence saying why the step exists,
 * and the step's own content.
 *
 * The blurb is not decoration. Every step here is asking for something the model
 * will use, and a user who knows what a field is *for* fills it in better than
 * one guessing at a label.
 */
export function StepFrame({
  title,
  blurb,
  children,
}: {
  title: string
  blurb: string
  children: ReactNode
}) {
  return (
    <div className="space-y-6">
      {/* Same heading/subline treatment as the product wizard's StepFrame, so
        * the two wizards read as one thing. */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{blurb}</p>
      </div>
      {children}
    </div>
  )
}
