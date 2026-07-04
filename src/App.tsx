import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AuthProvider } from "@/features/auth/AuthProvider"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { CompaniesPage } from "@/pages/CompaniesPage"
import { CompanyDetailPage } from "@/pages/CompanyDetailPage"
import { CompanySearchPage } from "@/pages/CompanySearchPage"
import { ContactsPage } from "@/pages/ContactsPage"
import { ContactDetailPage } from "@/pages/ContactDetailPage"
import { CampaignsPage } from "@/pages/CampaignsPage"
import { CampaignLayout } from "@/components/layout/CampaignLayout"
import { CampaignDashboardPage } from "@/pages/CampaignDashboardPage"
import { CampaignInfoPage } from "@/pages/CampaignInfoPage"
import { CampaignQuestionsPage } from "@/pages/CampaignQuestionsPage"
import { CampaignICPPage } from "@/pages/CampaignICPPage"
import { CampaignContactsPage } from "@/pages/CampaignContactsPage"
import { CompanyInfoPage } from "@/pages/CompanyInfoPage"
import { BrandProfilePage } from "@/pages/BrandProfilePage"
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
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/search" element={<CompanySearchPage />} />
              <Route path="/companies/:id" element={<CompanyDetailPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/:id" element={<CampaignLayout />}>
                <Route index element={<CampaignDashboardPage />} />
                <Route path="info" element={<CampaignInfoPage />} />
                <Route path="questions" element={<CampaignQuestionsPage />} />
                <Route path="icp" element={<CampaignICPPage />} />
                <Route path="contacts" element={<CampaignContactsPage />} />
              </Route>
              <Route
                path="/companies/:companyId/contacts/:contactId"
                element={<ContactDetailPage />}
              />
              <Route path="/company" element={<CompanyInfoPage />} />
              <Route path="/company/brand-profile" element={<BrandProfilePage />} />
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
