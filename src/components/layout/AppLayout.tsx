import { useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  Ban,
  Bot,
  Briefcase,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Package,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/useAuth"
import { PERMISSIONS } from "@/lib/permissions"

// Sidebar nav grouped into sections. A null title renders the items with no
// heading (Dashboard sits on its own). An item with a `permission` is only
// shown when the user's role grants it (permission-driven, not role-based); an
// array means "any of these".
type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  permission?: string | string[]
}

const navSections: { title: string | null; items: NavItem[] }[] = [
  {
    title: null,
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Campaign",
    items: [{ to: "/campaigns", label: "Campaigns", icon: Megaphone }],
  },
  {
    title: "Company",
    items: [
      {
        to: "/company",
        label: "Company Info",
        icon: Briefcase,
        permission: PERMISSIONS.companyInfo,
      },
      { to: "/products", label: "Products", icon: Package },
      {
        to: "/company/agent-instructions",
        label: "Agent Instructions",
        icon: Bot,
        permission: PERMISSIONS.agentInstructions,
      },
      {
        to: "/exclusions",
        label: "Exclusion List",
        icon: Ban,
        permission: PERMISSIONS.exclusionLists,
      },
    ],
  },
  {
    title: "Team",
    items: [
      {
        to: "/company/teams",
        label: "Teams",
        icon: UsersRound,
        permission: PERMISSIONS.teams,
      },
      {
        to: "/company/users",
        label: "Users",
        icon: ShieldCheck,
        permission: [PERMISSIONS.usersView, PERMISSIONS.usersViewAll],
      },
    ],
  },
]

const navItems = navSections.flatMap((section) => section.items)

function initialsOf(name: string | undefined): string {
  if (!name) return "U"
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

/** Authenticated dashboard shell: left sidebar nav + top bar + content outlet. */
export function AppLayout() {
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Hide items the user's role can't access, then drop any section left empty.
  const canSee = (item: NavItem) => {
    if (!item.permission) return true
    const keys = Array.isArray(item.permission)
      ? item.permission
      : [item.permission]
    return keys.some(hasPermission)
  }
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(canSee),
    }))
    .filter((section) => section.items.length > 0)

  async function handleLogout() {
    try {
      await logout()
    } catch {
      toast.error("Logout request failed, but you've been signed out locally.")
    } finally {
      navigate("/login", { replace: true })
    }
  }

  return (
    <div className="flex min-h-svh">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 -translate-x-full border-r bg-sidebar transition-transform md:static md:translate-x-0",
          sidebarOpen && "translate-x-0",
        )}
      >
        <div className="flex h-14 items-center px-4 font-semibold">Paraden ARIA</div>
        <Separator />
        <nav className="space-y-4 p-2">
          {visibleSections.map((section, i) => (
            <div key={section.title ?? `section-${i}`} className="space-y-1">
              {section.title && (
                <p className="px-3 pt-1 pb-0.5 text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                // Active when this item is the most specific (longest) matching
                // path, so /companies/search highlights its own item, not /companies.
                const matches = navItems
                  .filter((n) =>
                    n.to === "/"
                      ? location.pathname === "/"
                      : location.pathname === n.to ||
                        location.pathname.startsWith(`${n.to}/`),
                  )
                  .sort((a, b) => b.to.length - a.to.length)
                const active = matches[0]?.to === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="size-8">
                  <AvatarFallback>{initialsOf(user?.full_name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.full_name ?? "My account"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <UserRound className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/email-settings">
                  <Mail className="size-4" />
                  Email settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
