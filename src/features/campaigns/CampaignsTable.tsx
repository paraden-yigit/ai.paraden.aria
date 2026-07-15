import { Eye, Megaphone, MoreHorizontal, Trash2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTime } from "@/lib/format"
import { campaignStatusMeta } from "@/features/campaigns/status"
import type { Campaign } from "@/types/campaign"

interface CampaignsTableProps {
  campaigns: Campaign[]
  /** Opening a completed campaign goes to its detail; an incomplete one prompts
   * to resume or restart — the page decides. */
  onOpen: (campaign: Campaign) => void
  onDelete: (campaign: Campaign) => void
}

export function CampaignsTable({ campaigns, onOpen, onDelete }: CampaignsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow
              key={campaign.id}
              className="cursor-pointer"
              onClick={() => onOpen(campaign)}
            >
              <TableCell>
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted"
                  >
                    <Megaphone className="size-4 text-muted-foreground" />
                  </span>
                  <span className="font-medium">{campaign.name}</span>
                </span>
              </TableCell>
              <TableCell>
                {(() => {
                  const { label, variant } = campaignStatusMeta(campaign)
                  return <Badge variant={variant}>{label}</Badge>
                })()}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {campaign.product_name ?? "No product"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {campaign.team_name ?? "No team"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {campaign.created_by_name ?? "Unknown"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(campaign.created_at)}
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
                    <DropdownMenuItem onClick={() => onOpen(campaign)}>
                      <Eye className="size-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(campaign)}
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
