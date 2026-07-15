import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw, Save, UserRound, Users } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/services/http"
import { productService } from "@/services/product.service"
import { teamService } from "@/services/team.service"
import { userService } from "@/services/user.service"
import type { ClientUser } from "@/types/user"
import type { Team } from "@/types/team"

interface ProductAccessTabProps {
  productId: number
}

/** Add/remove an id from a Set immutably (so React sees a new reference). */
function toggleId(set: Set<number>, id: number): Set<number> {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

/**
 * Access tab for a product (shown only to users with "products_manage" — the
 * parent gates rendering). Assign the product to whole teams and/or people, then
 * save. Everyone on an assigned team, each assigned person, and those people's
 * team leaders can then see the product and use it in their campaigns. With
 * nothing assigned the product is owner-only.
 */
export function ProductAccessTab({ productId }: ProductAccessTabProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<ClientUser[]>([])
  const [teamIds, setTeamIds] = useState<Set<number>>(new Set())
  const [userIds, setUserIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [teamsRes, usersRes, assignments] = await Promise.all([
        teamService.list({ limit: 200 }),
        userService.list({ limit: 200 }),
        productService.getAssignments(productId),
      ])
      setTeams(teamsRes.items)
      setUsers(usersRes.items)
      setTeamIds(new Set(assignments.team_ids))
      setUserIds(new Set(assignments.user_ids))
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load access settings.",
      )
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function handleSave() {
    setSaving(true)
    try {
      const saved = await productService.setAssignments(productId, {
        team_ids: [...teamIds],
        user_ids: [...userIds],
      })
      setTeamIds(new Set(saved.team_ids))
      setUserIds(new Set(saved.user_ids))
      toast.success("Access updated.")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update access.",
      )
    } finally {
      setSaving(false)
    }
  }

  const restricted = teamIds.size > 0 || userIds.size > 0

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
    )
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Access</h2>
          <p className="text-muted-foreground">
            {restricted
              ? "Only the teams and people below can see this product and use it in their campaigns."
              : "This product is currently owner-only. Assign teams or people below to give them access."}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save access
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            Teams
          </CardTitle>
          <CardDescription>
            Everyone on an assigned team can use this product.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teams yet.</p>
          ) : (
            <ul className="divide-y">
              {teams.map((team) => {
                const checked = teamIds.has(team.id)
                return (
                  <li key={team.id}>
                    <label className="flex cursor-pointer items-center gap-3 py-2.5">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          setTeamIds((prev) => toggleId(prev, team.id))
                        }
                      />
                      <span className="text-sm font-medium">{team.name}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-4" />
            People
          </CardTitle>
          <CardDescription>
            Each assigned person — and the team leaders of their team — can use
            this product.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No people yet.</p>
          ) : (
            <ul className="divide-y">
              {users.map((clientUser) => {
                const checked = userIds.has(clientUser.id)
                const teamNames = clientUser.teams
                  .map((team) => team.name)
                  .join(", ")
                return (
                  <li key={clientUser.id}>
                    <label className="flex cursor-pointer items-center gap-3 py-2.5">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          setUserIds((prev) => toggleId(prev, clientUser.id))
                        }
                      />
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {clientUser.full_name}
                        </span>
                        {clientUser.role === "team_leader" && (
                          <Badge variant="secondary">Team leader</Badge>
                        )}
                        {clientUser.role === "owner" && (
                          <Badge variant="secondary">Owner</Badge>
                        )}
                      </span>
                      {teamNames && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {teamNames}
                        </span>
                      )}
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
