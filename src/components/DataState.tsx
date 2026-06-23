import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface DataStateProps {
  loading: boolean
  error: string | null
  isEmpty: boolean
  emptyMessage: string
  onRetry: () => void
  /** Number of skeleton rows to render while loading. */
  skeletonRows?: number
  children: React.ReactNode
}

/**
 * Reusable loading / error / empty handling for list views. Renders `children`
 * only when data is present, otherwise the appropriate placeholder.
 */
export function DataState({
  loading,
  error,
  isEmpty,
  emptyMessage,
  onRetry,
  skeletonRows = 6,
  children,
}: DataStateProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return <>{children}</>
}
