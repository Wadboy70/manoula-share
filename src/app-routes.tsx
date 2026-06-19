import { createRoutesFromElements, Route } from 'react-router-dom'

import {
  AdminOnlyRoute,
  ProfessionalOnlyRoute,
  ProtectedRoute,
} from '@/components/auth/protected-route'
import { NotFoundTrigger } from '@/components/errors/not-found-trigger'
import { RouteErrorPage } from '@/components/errors/route-error-page'
import { prelaunchGuard } from '@/lib/prelaunch-guard'
import { SiteChrome } from '@/components/site-chrome'
import {
  DashboardLayout,
  DashboardOverviewPage,
  DashboardProfilePage,
  DashboardServicesPage,
  DashboardSettingsPlaceholderPage,
  DashboardAvailabilityPage,
} from '@/pages/dashboard-page'
import { DashboardBookingsPage } from '@/pages/dashboard-bookings-page'
import { AdminIntakeLeadsPage } from '@/pages/admin-page'
import { ClientIntakePage } from '@/pages/client-intake-page'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { HomePage } from '@/pages/home-page'
import { ProfessionalIntakePage } from '@/pages/professional-intake-page'
import { ProfessionalOnboardingPage } from '@/pages/professional-onboarding-page'
import { ResetPasswordPage } from '@/pages/reset-password-page'
import { ProfessionalPage } from '@/pages/professional-page'
import { MessagingIndexRoute } from '@/features/messaging/messaging-index-route'
import { MessagingLayout } from '@/features/messaging/messaging-layout'
import { MessagingStartRoute } from '@/features/messaging/messaging-start-route'
import { MessagingThreadRoute } from '@/features/messaging/messaging-thread-route'
import { ClientBookingsPage } from '@/pages/bookings-page'
import { SearchPage } from '@/pages/search-page'
import { SignInPage } from '@/pages/sign-in-page'
import { SignUpPage } from '@/pages/sign-up-page'

/** Shared route tree for BrowserRouter (tests) and data routers (app + integration). */
export const appRouteObjects = createRoutesFromElements(
  <Route element={<SiteChrome />} errorElement={<RouteErrorPage />}>
    <Route index element={<HomePage />} />
    <Route path="find-support" element={<ClientIntakePage />} />
    <Route path="join" element={<ProfessionalIntakePage />} />
    <Route
      path="professional/onboarding"
      element={prelaunchGuard(
        <ProtectedRoute>
          <ProfessionalOnboardingPage />
        </ProtectedRoute>,
      )}
    />
    <Route path="signup" element={<SignUpPage />} />
    <Route path="signin" element={<SignInPage />} />
    <Route path="forgot-password" element={<ForgotPasswordPage />} />
    <Route path="reset-password" element={<ResetPasswordPage />} />
    <Route path="search" element={prelaunchGuard(<SearchPage />)} />
    <Route
      path="professionals/:professionalId"
      element={prelaunchGuard(
        <ProtectedRoute>
          <ProfessionalPage />
        </ProtectedRoute>,
      )}
    />
    <Route
      path="bookings"
      element={prelaunchGuard(
        <ProtectedRoute>
          <ClientBookingsPage />
        </ProtectedRoute>,
      )}
    />
    <Route
      path="messages"
      element={prelaunchGuard(
        <ProtectedRoute>
          <MessagingLayout />
        </ProtectedRoute>,
      )}
    >
      <Route index element={<MessagingIndexRoute />} />
      <Route path="start/:professionalId" element={<MessagingStartRoute />} />
      <Route path=":conversationId" element={<MessagingThreadRoute />} />
    </Route>
    <Route
      path="dashboard"
      element={prelaunchGuard(
        <ProfessionalOnlyRoute>
          <DashboardLayout />
        </ProfessionalOnlyRoute>,
      )}
    >
      <Route index element={<DashboardOverviewPage />} />
      <Route path="bookings" element={<DashboardBookingsPage />} />
      <Route path="profile" element={<DashboardProfilePage />} />
      <Route path="services" element={<DashboardServicesPage />} />
      <Route path="availability" element={<DashboardAvailabilityPage />} />
      <Route path="settings" element={<DashboardSettingsPlaceholderPage />} />
    </Route>
    <Route
      path="admin"
      element={
        <AdminOnlyRoute>
          <AdminIntakeLeadsPage />
        </AdminOnlyRoute>
      }
    />
    <Route path="*" element={<NotFoundTrigger />} />
  </Route>,
)
