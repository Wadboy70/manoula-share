import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthNavActions } from '@/components/auth-nav-actions'
import { useAuth } from '@/hooks/use-auth'

export function MobileAuthNav() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  async function onLogout() {
    setLoggingOut(true)
    try {
      await signOut()
    } finally {
      setLoggingOut(false)
      navigate('/')
    }
  }

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-40 border-t border-white/10 bg-[#1a1a1a] px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-zinc-200 md:hidden"
      aria-label="Account"
    >
      <AuthNavActions
        session={session}
        loggingOut={loggingOut}
        onLogout={onLogout}
        variant="mobile"
      />
    </nav>
  )
}
