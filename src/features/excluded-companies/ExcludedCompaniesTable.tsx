import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTime } from "@/lib/format"
import type { ExcludedCompany } from "@/types/excluded-company"

interface ExcludedCompaniesTableProps {
  companies: ExcludedCompany[]
  onEdit: (company: ExcludedCompany) => void
  onDelete: (company: ExcludedCompany) => void
}

export function ExcludedCompaniesTable({
  companies,
  onEdit,
  onDelete,
}: ExcludedCompaniesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company name</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>LinkedIn URL</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {company.domain || "None"}
              </TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {company.linkedin_url ? (
                  <a
                    href={company.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {company.linkedin_url}
                  </a>
                ) : (
                  "None"
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(company.created_at)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Open actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(company)}>
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(company)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
