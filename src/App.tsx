import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "next-themes"

import { AuthProvider } from "@/features/auth/AuthProvider"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { RequirePermission } from "@/components/auth/RequirePermission"
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute"
import { OnboardingGate } from "@/components/auth/OnboardingGate"
import { PERMISSIONS } from "@/lib/permissions"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/ResetPasswordPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { AccountSettingsPage } from "@/pages/AccountSettingsPage"
import { ProfileSettingsPage } from "@/pages/ProfileSettingsPage"
import { EmailSettingsPage } from "@/pages/EmailSettingsPage"
import { ExclusionListPage } from "@/pages/ExclusionListPage"
import { CampaignsPage } from "@/pages/CampaignsPage"
import { NewCampaignPage } from "@/pages/NewCampaignPage"
import { OnboardingPage } from "@/pages/OnboardingPage"
import { CampaignLayout } from "@/components/layout/CampaignLayout"
import { CampaignDashboardPage } from "@/pages/CampaignDashboardPage"
import { CampaignContactsPage } from "@/pages/CampaignContactsPage"
import { CampaignEmailsPage } from "@/pages/CampaignEmailsPage"
import { ProductsPage } from "@/pages/ProductsPage"
import { NewProductPage } from "@/pages/NewProductPage"
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
    // Light is the product default; dark is an explicit choice, remembered
    // per browser. enableSystem stays off so the OS never overrides it.
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="paraden-theme"
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              {/* Password reset. Public-only like login: anyone here has lost
                  their session, and a signed-in user belongs in the app. */}
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="/reset-password/:token"
                element={<ResetPasswordPage />}
              />
            </Route>

            <Route element={<ProtectedRoute />}>
              {/* Full-screen first-login onboarding wizard — outside AppLayout so
                  it has no sidebar/header, only its own minimal chrome. */}
              <Route path="/onboarding" element={<OnboardingPage />} />
              {/* Full-page campaign wizard — deliberately outside AppLayout so it
                  has no sidebar or header, only its own close button. */}
              <Route path="/campaigns/new" element={<NewCampaignPage />} />
              {/* Full-page product creation wizard — outside AppLayout, same as
                  the campaign wizard (its own minimal chrome, no app shell). */}
              <Route path="/products/new" element={<NewProductPage />} />
              {/* Everything under the app shell first passes the onboarding gate:
                  unonboarded owners go to the wizard, other users wait. */}
              <Route element={<OnboardingGate />}>
                <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route
                  path="/account-settings"
                  element={<AccountSettingsPage />}
                />
                <Route
                  path="/profile-settings"
                  element={<ProfileSettingsPage />}
                />
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
                  <Route path="emails" element={<CampaignEmailsPage />} />
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
            </Route>

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
