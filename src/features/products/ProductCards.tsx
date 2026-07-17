import { Link, useNavigate } from "react-router-dom"
import { Eye, MoreHorizontal, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTime } from "@/lib/format"
import type { Product } from "@/types/product"

interface ProductCardsProps {
  products: Product[]
  /** Delete a product. Omit to hide the delete action (read-only viewers). */
  onDelete?: (product: Product) => void
}

// The product-brief answers, used for the completeness hint. A fuller
// brief means sharper ICP generation and better outreach drafts.
const BRIEF_KEYS = [
  "offering",
  "audience",
  "problem_solved",
  "buyer_challenges",
  "proof_points",
  "buyer_outcome",
] as const

function answeredCount(product: Product): number {
  return BRIEF_KEYS.filter((key) => product[key]?.trim()).length
}

/** Products as a card grid: monogram, offering, brief completeness. The whole
 * card opens the product; row actions sit above the stretched link. */
export function ProductCards({ products, onDelete }: ProductCardsProps) {
  const navigate = useNavigate()

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => {
        const answered = answeredCount(product)
        return (
          <Card
            key={product.id}
            className="group relative gap-4 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <Link
              to={`/products/${product.id}`}
              className="absolute inset-0 rounded-xl"
              aria-label={`Open ${product.name}`}
            />
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-semibold text-primary uppercase"
              >
                {product.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {product.name}
              </span>
              <span className="relative z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Open actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <Eye className="size-4" />
                      View
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(product)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </span>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                {product.offering ?? "No offering described yet."}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2">
                {answered === BRIEF_KEYS.length ? (
                  <Badge variant="outline">Brief complete</Badge>
                ) : (
                  <Badge variant="secondary">
                    {answered} of {BRIEF_KEYS.length} answered
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(product.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
