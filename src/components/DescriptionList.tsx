export interface DescriptionItem {
  label: string
  value: React.ReactNode
}

/** Reusable responsive key/value list for detail/read-only views. */
export function DescriptionList({ items }: { items: DescriptionItem[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
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
