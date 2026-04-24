import { Route, Routes } from 'react-router-dom'

import {
  ProfessionalOnlyRoute,
  ProtectedRoute,
} from '@/components/auth/protected-route'
import { SiteChrome } from '@/components/site-chrome'
import { DashboardPage } from '@/pages/dashboard-page'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { HomePage } from '@/pages/home-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'
import { ProfessionalPage } from '@/pages/professional-page'
import { SearchPage } from '@/pages/search-page'
import { SignInPage } from '@/pages/sign-in-page'
import { SignUpPage } from '@/pages/sign-up-page'

function App() {
  return (
    <Routes>
      <Route element={<SiteChrome />}>
        <Route index element={<HomePage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="signin" element={<SignInPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route
          path="professionals/:professionalId"
          element={
            <ProtectedRoute>
              <ProfessionalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProfessionalOnlyRoute>
              <DashboardPage />
            </ProfessionalOnlyRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
