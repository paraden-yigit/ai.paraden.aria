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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Company } from "@/types/company"

interface CompaniesTableProps {
  companies: Company[]
  onDelete: (company: Company) => void
}

export function CompaniesTable({ companies, onDelete }: CompaniesTableProps) {
  const navigate = useNavigate()

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Headcount</TableHead>
            <TableHead>Country</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow
              key={company.id}
              className="cursor-pointer"
              onClick={() => navigate(`/companies/${company.id}`)}
            >
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell className="text-muted-foreground">{company.domain}</TableCell>
              <TableCell>{company.industry || "—"}</TableCell>
              <TableCell>{company.headcount_range || "—"}</TableCell>
              <TableCell>{company.hq_country || "—"}</TableCell>
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
                      onClick={() => navigate(`/companies/${company.id}`)}
                    >
                      <Eye className="size-4" />
                      View
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
