import { Button } from "@/components/ui/button"

interface PaginationFooterProps {
  page: number
  skip: number
  /** Number of items on the current page. */
  count: number
  total?: number
  hasNextPage: boolean
  onPrev: () => void
  onNext: () => void
}

/** Reusable list pagination footer: range summary + Previous/Next controls. */
export function PaginationFooter({
  page,
  skip,
  count,
  total,
  hasNextPage,
  onPrev,
  onNext,
}: PaginationFooterProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {typeof total === "number"
          ? count > 0
            ? `Showing ${skip + 1} to ${skip + count} of ${total}`
            : `0 of ${total}`
          : `Page ${page + 1}`}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={onPrev}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNextPage} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  )
}
