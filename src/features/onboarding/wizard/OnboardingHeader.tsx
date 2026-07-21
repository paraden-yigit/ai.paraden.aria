import { useNavigate } from "react-router-dom"
import { LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/features/auth/useAuth"

function initialsOf(name: string | undefined): string {
  if (!name) return "U"
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

/**
 * Minimal chrome for the onboarding wizard: the Paraden ARIA logo top-left, a
 * theme toggle + account menu top-right. No sidebar and no horizontal dividers
 * (no `border-b` / separators) — the wizard owns the whole screen.
 */
export function OnboardingHeader() {
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const navigate = useNavigate()
  const isDark = resolvedTheme === "dark"

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
    <header className="flex h-16 items-center justify-between px-6">
      <img
        src={isDark ? "/paraden-aria-no-box-dark.svg" : "/paraden-aria-no-box.svg"}
        alt="Paraden ARIA"
        className="h-7 w-auto"
      />
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-8">
                <AvatarFallback>{initialsOf(user?.full_name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.full_name ?? "My account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
