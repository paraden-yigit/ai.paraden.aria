import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricTileProps {
  icon: LucideIcon
  label: string
  value: string
  caption: string
  /** Ring the tile in the primary tint (for the North Star metric). */
  emphasis?: boolean
}

/**
 * One compact stat tile: an icon chip beside the label, value and caption.
 * Shared by the dashboard performance strip and the campaign metrics grid so
 * the two read as one system. `py-0` neutralises the Card's built-in vertical
 * padding; the tile's own p-3 keeps it tight.
 */
export function MetricTile({
  icon: Icon,
  label,
  value,
  caption,
  emphasis = false,
}: MetricTileProps) {
  return (
    <Card className={cn("py-0", emphasis && "border-primary/60 bg-primary/5")}>
      <CardContent className="flex items-center gap-3 p-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            emphasis
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <span className="block text-xl font-semibold tabular-nums tracking-tight">
            {value}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {caption}
          </span>
        </span>
      </CardContent>
    </Card>
  )
}
