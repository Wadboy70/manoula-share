import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabaseClient'
import type { AppUser } from '@/types/auth'

type AuthContextValue = {
  session: Session | null
  user: User | null
  appUser: AppUser | null
  loading: boolean
  loadAppUser: (authUser: User, allowRecovery?: boolean) => Promise<AppUser | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readMetadataName(
  user: User,
  key: 'first_name' | 'last_name',
): string | null {
  const metadata = user.user_metadata
  if (!metadata || typeof metadata !== 'object') return null
  const value = (metadata as Record<string, unknown>)[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function fetchUserRow(authUser: User): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select(
      'id,created_at,auth_user_id,first_name,last_name,email,is_professional,profile_photo_url,bio,is_profile_complete,is_searchable,is_public_searchable,country_code,location_locality,location_region,postal_code,service_area,rating_avg,rating_count',
    )
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAppUser = useCallback(
    async (authUser: User, allowRecovery = false): Promise<AppUser | null> => {
      const existing = await fetchUserRow(authUser)
      if (existing) {
        setAppUser(existing)
        return existing
      }

      if (!allowRecovery) {
        setAppUser(null)
        return null
      }

      const recoveryPayload = {
        auth_user_id: authUser.id,
        email: authUser.email ?? null,
        first_name: readMetadataName(authUser, 'first_name'),
        last_name: readMetadataName(authUser, 'last_name'),
      }

      const { error } = await supabase.from('users').insert(recoveryPayload)
      if (error) {
        setAppUser(null)
        return null
      }

      const recovered = await fetchUserRow(authUser)
      setAppUser(recovered)
      return recovered
    },
    [],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setAppUser(null)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        await loadAppUser(currentSession.user)
      } else {
        setAppUser(null)
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    bootstrap().catch(() => {
      if (isMounted) {
        setSession(null)
        setUser(null)
        setAppUser(null)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return

      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (!nextSession?.user || event === 'SIGNED_OUT') {
        setAppUser(null)
        return
      }

      void loadAppUser(nextSession.user)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadAppUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      appUser,
      loading,
      loadAppUser,
      signOut,
    }),
    [session, user, appUser, loading, loadAppUser, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
