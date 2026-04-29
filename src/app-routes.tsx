import { createRoutesFromElements, Route } from 'react-router-dom'

import {
  ProfessionalOnlyRoute,
  ProtectedRoute,
} from '@/components/auth/protected-route'
import { SiteChrome } from '@/components/site-chrome'
import { SignUpRoutesLayout } from '@/features/auth/sign-up-routes-layout'
import {
  DashboardLayout,
  DashboardOverviewPage,
  DashboardProfilePage,
  DashboardServicesPlaceholderPage,
  DashboardSettingsPlaceholderPage,
} from '@/pages/dashboard-page'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { HomePage } from '@/pages/home-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'
import { ProfessionalPage } from '@/pages/professional-page'
import { SearchPage } from '@/pages/search-page'
import { SignInPage } from '@/pages/sign-in-page'
import { SignUpPage } from '@/pages/sign-up-page'

/** Shared route tree for BrowserRouter (tests) and data routers (app + integration). */
export const appRouteObjects = createRoutesFromElements(
  <Route element={<SiteChrome />}>
    <Route index element={<HomePage />} />
    <Route path="signup" element={<SignUpRoutesLayout />}>
      <Route index element={<SignUpPage />} />
      <Route path="professional" element={<SignUpPage />} />
    </Route>
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
          <DashboardLayout />
        </ProfessionalOnlyRoute>
      }
    >
      <Route index element={<DashboardOverviewPage />} />
      <Route path="profile" element={<DashboardProfilePage />} />
      <Route path="services" element={<DashboardServicesPlaceholderPage />} />
      <Route path="settings" element={<DashboardSettingsPlaceholderPage />} />
    </Route>
  </Route>,
)
