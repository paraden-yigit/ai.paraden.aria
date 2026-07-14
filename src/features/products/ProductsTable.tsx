import { useNavigate } from "react-router-dom"
import { Eye, MoreHorizontal, Trash2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTime } from "@/lib/format"
import type { Product } from "@/types/product"

interface ProductsTableProps {
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

export function ProductsTable({ products, onDelete }: ProductsTableProps) {
  const navigate = useNavigate()

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Brief</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const answered = answeredCount(product)
            return (
            <TableRow
              key={product.id}
              className="cursor-pointer"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <TableCell>
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted text-sm font-semibold uppercase"
                  >
                    {product.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{product.name}</span>
                    {product.offering && (
                      <span className="block max-w-md truncate text-sm text-muted-foreground">
                        {product.offering}
                      </span>
                    )}
                  </span>
                </span>
              </TableCell>
              <TableCell>
                {answered === BRIEF_KEYS.length ? (
                  <Badge variant="outline">Complete</Badge>
                ) : (
                  <Badge variant="secondary">
                    {answered} of {BRIEF_KEYS.length} answered
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(product.created_at)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
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
              </TableCell>
            </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
