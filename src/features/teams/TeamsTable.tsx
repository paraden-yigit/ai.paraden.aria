import { useNavigate } from "react-router-dom"
import { MoreHorizontal, Pencil, Trash2, Users, UsersRound } from "lucide-react"

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
import type { Team } from "@/types/team"

interface TeamsTableProps {
  teams: Team[]
  onEdit: (team: Team) => void
  onDelete: (team: Team) => void
}

export function TeamsTable({ teams, onEdit, onDelete }: TeamsTableProps) {
  const navigate = useNavigate()

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow
              key={team.id}
              className="cursor-pointer"
              onClick={() => navigate(`/workspace/teams/${team.id}`)}
            >
              <TableCell>
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                  >
                    <UsersRound className="size-4" />
                  </span>
                  <span className="font-medium">{team.name}</span>
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(team.created_at)}
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
                      onClick={() => navigate(`/workspace/teams/${team.id}`)}
                    >
                      <Users className="size-4" />
                      Manage members
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(team)}>
                      <Pencil className="size-4" />
                      Edit name
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(team)}
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
