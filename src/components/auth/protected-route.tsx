import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/use-auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="font-body flex min-h-svh items-center justify-center bg-[#1a1a1a] text-sm text-zinc-300">
        Loading...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />
  }

  return children
}

export function ProfessionalOnlyRoute({
  children,
}: {
  children: ReactNode
}) {
  const { appUser, loading, session } = useAuth()

  if (loading) {
    return (
      <div className="font-body flex min-h-svh items-center justify-center bg-[#1a1a1a] text-sm text-zinc-300">
        Loading...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/signin" replace />
  }

  if (!appUser?.is_professional) {
    return <Navigate to="/search" replace />
  }

  return children
}
