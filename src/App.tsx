import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AuthProvider } from "@/features/auth/AuthProvider"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ExclusionListPage } from "@/pages/ExclusionListPage"
import { CampaignsPage } from "@/pages/CampaignsPage"
import { NewCampaignPage } from "@/pages/NewCampaignPage"
import { CampaignLayout } from "@/components/layout/CampaignLayout"
import { CampaignDashboardPage } from "@/pages/CampaignDashboardPage"
import { CampaignContactsPage } from "@/pages/CampaignContactsPage"
import { ProductsPage } from "@/pages/ProductsPage"
import { ProductDetailPage } from "@/pages/ProductDetailPage"
import { CompanyInfoPage } from "@/pages/CompanyInfoPage"
import { BrandProfilePage } from "@/pages/BrandProfilePage"
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
              <Route path="/exclusions" element={<ExclusionListPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/:id" element={<CampaignLayout />}>
                <Route index element={<CampaignDashboardPage />} />
                <Route path="contacts" element={<CampaignContactsPage />} />
              </Route>
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/company" element={<CompanyInfoPage />} />
              <Route path="/company/brand-profile" element={<BrandProfilePage />} />
              <Route
                path="/company/agent-instructions"
                element={<AgentInstructionsPage />}
              />
              <Route path="/company/teams" element={<TeamsPage />} />
              <Route path="/company/teams/:id" element={<TeamDetailPage />} />
              <Route path="/company/users" element={<UsersPage />} />
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
