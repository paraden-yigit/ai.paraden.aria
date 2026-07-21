import { cn } from "@/lib/utils"

export interface DescriptionItem {
  label: string
  value: React.ReactNode
}

/** Reusable responsive key/value list for detail/read-only views. */
export function DescriptionList({
  items,
  singleColumn = false,
}: {
  items: DescriptionItem[]
  /** Force one item per row instead of the default two-column layout. */
  singleColumn?: boolean
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        !singleColumn && "sm:grid-cols-2",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="text-sm">
            {item.value || <span className="text-muted-foreground">Not set</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
