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
import { CompanyInfoPage } from "@/pages/CompanyInfoPage"
import { BrandProfilePage } from "@/pages/BrandProfilePage"
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
              <Route
                path="/companies/:companyId/contacts/:contactId"
                element={<ContactDetailPage />}
              />
              <Route path="/company" element={<CompanyInfoPage />} />
              <Route path="/company/brand-profile" element={<BrandProfilePage />} />
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
