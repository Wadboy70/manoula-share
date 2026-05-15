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
  DashboardServicesPage,
  DashboardSettingsPlaceholderPage,
} from '@/pages/dashboard-page'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { HomePage } from '@/pages/home-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'
import { ProfessionalPage } from '@/pages/professional-page'
import { MessagingIndexRoute } from '@/features/messaging/messaging-index-route'
import { MessagingLayout } from '@/features/messaging/messaging-layout'
import { MessagingStartRoute } from '@/features/messaging/messaging-start-route'
import { MessagingThreadRoute } from '@/features/messaging/messaging-thread-route'
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
      path="messages"
      element={
        <ProtectedRoute>
          <MessagingLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<MessagingIndexRoute />} />
      <Route path="start/:professionalId" element={<MessagingStartRoute />} />
      <Route path=":conversationId" element={<MessagingThreadRoute />} />
    </Route>
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
      <Route path="services" element={<DashboardServicesPage />} />
      <Route path="settings" element={<DashboardSettingsPlaceholderPage />} />
    </Route>
  </Route>,
)
