import { Route, Routes } from 'react-router-dom'

import {
  ProfessionalOnlyRoute,
  ProtectedRoute,
} from '@/components/auth/protected-route'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { DashboardPage } from '@/pages/dashboard-page'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { HomePage } from '@/pages/home-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'
import { SearchPage } from '@/pages/search-page'
import { SignInPage } from '@/pages/sign-in-page'
import { SignUpPage } from '@/pages/sign-up-page'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="bg-background flex min-h-svh flex-col">
            <SiteHeader />
            <HomePage />
            <SiteFooter />
          </div>
        }
      />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProfessionalOnlyRoute>
            <DashboardPage />
          </ProfessionalOnlyRoute>
        }
      />
    </Routes>
  )
}

export default App
