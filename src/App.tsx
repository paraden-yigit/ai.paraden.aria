import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AuthProvider } from "@/features/auth/AuthProvider"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { RequirePermission } from "@/components/auth/RequirePermission"
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute"
import { PERMISSIONS } from "@/lib/permissions"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { UserProfilePage } from "@/pages/UserProfilePage"
import { EmailSettingsPage } from "@/pages/EmailSettingsPage"
import { ExclusionListPage } from "@/pages/ExclusionListPage"
import { CampaignsPage } from "@/pages/CampaignsPage"
import { NewCampaignPage } from "@/pages/NewCampaignPage"
import { CampaignLayout } from "@/components/layout/CampaignLayout"
import { CampaignDashboardPage } from "@/pages/CampaignDashboardPage"
import { CampaignContactsPage } from "@/pages/CampaignContactsPage"
import { ProductsPage } from "@/pages/ProductsPage"
import { ProductDetailPage } from "@/pages/ProductDetailPage"
import { CompanyInfoPage } from "@/pages/CompanyInfoPage"
import { AgentInstructionsPage } from "@/pages/AgentInstructionsPage"
import { TeamsPage } from "@/pages/TeamsPage"
import { TeamDetailPage } from "@/pages/TeamDetailPage"
import { UsersPage } from "@/pages/UsersPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            {/* Full-page campaign wizard — deliberately outside AppLayout so it
                has no sidebar or header, only its own close button. */}
            <Route path="/campaigns/new" element={<NewCampaignPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/email-settings" element={<EmailSettingsPage />} />
              <Route
                element={
                  <RequirePermission permission={PERMISSIONS.exclusionLists} />
                }
              >
                <Route path="/exclusions" element={<ExclusionListPage />} />
              </Route>
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/:id" element={<CampaignLayout />}>
                <Route index element={<CampaignDashboardPage />} />
                <Route path="contacts" element={<CampaignContactsPage />} />
              </Route>
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route
                element={
                  <RequirePermission permission={PERMISSIONS.companyInfo} />
                }
              >
                <Route path="/company" element={<CompanyInfoPage />} />
              </Route>
              <Route
                element={
                  <RequirePermission permission={PERMISSIONS.agentInstructions} />
                }
              >
                <Route
                  path="/company/agent-instructions"
                  element={<AgentInstructionsPage />}
                />
              </Route>
              <Route
                element={<RequirePermission permission={PERMISSIONS.teams} />}
              >
                <Route path="/company/teams" element={<TeamsPage />} />
                <Route path="/company/teams/:id" element={<TeamDetailPage />} />
              </Route>
              <Route
                element={
                  <RequirePermission
                    permission={[
                      PERMISSIONS.usersView,
                      PERMISSIONS.usersViewAll,
                    ]}
                  />
                }
              >
                <Route path="/company/users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
