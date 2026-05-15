import { useEffect, useRef } from 'react'

import { useParams, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useMessagingStartState } from './use-messaging-start-state'

export function MessagingStartRoute() {
  const { professionalId: raw } = useParams<{ professionalId: string }>()
  const professionalId = raw ? Number(raw) : NaN

  if (!Number.isFinite(professionalId) || professionalId <= 0) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
        Invalid link.
      </div>
    )
  }

  return <MessagingStartInner professionalId={Math.trunc(professionalId)} />
}

function MessagingStartInner({ professionalId }: { professionalId: number }) {
  const navigate = useNavigate()
  const {
    services,
    status,
    error,
    selectedServiceId,
    setSelectedServiceId,
    reload,
    ensureConversation,
    clearError,
  } = useMessagingStartState(professionalId)
  const autoStarted = useRef(false)

  useEffect(() => {
    autoStarted.current = false
  }, [professionalId])

  useEffect(() => {
    if (status !== 'ready' || services.length !== 1) return
    if (autoStarted.current) return
    autoStarted.current = true
    let cancelled = false
    void (async () => {
      const { conversationId, error: err } = await ensureConversation(services[0].id)
      if (cancelled) return
      if (conversationId != null) {
        navigate(`/messages/${conversationId}`, { replace: true })
      } else if (err) {
        autoStarted.current = false
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status, services, ensureConversation, navigate])

  if (status === 'loading' || (status === 'ensuring' && services.length !== 1)) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
        {status === 'ensuring' ? 'Starting conversation…' : 'Loading services…'}
      </div>
    )
  }

  if (status === 'error' && services.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-destructive text-sm">{error ?? 'Something went wrong.'}</p>
        <Button type="button" variant="outline" onClick={() => void reload()}>
          Try again
        </Button>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-center text-sm">
        No bookable services are available for this professional yet.
      </div>
    )
  }

  if (services.length === 1) {
    if (status === 'error' && error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearError()
              autoStarted.current = false
              void (async () => {
                autoStarted.current = true
                const { conversationId, error: err } = await ensureConversation(services[0].id)
                if (conversationId != null) {
                  navigate(`/messages/${conversationId}`, { replace: true })
                } else if (err) {
                  autoStarted.current = false
                }
              })()
            }}
          >
            Try again
          </Button>
        </div>
      )
    }
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
        Starting conversation…
      </div>
    )
  }

  async function onContinue() {
    if (selectedServiceId == null) return
    const { conversationId } = await ensureConversation(selectedServiceId)
    if (conversationId != null) {
      navigate(`/messages/${conversationId}`, { replace: true })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h2 className="text-foreground font-heading text-xl">Choose a service</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Select the consultation you would like to discuss. A booking record is created when you
          continue. {/* TODO(booking): wire full booking fields and checkout when booking flows ship. */}
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {services.map((s) => {
          const selected = selectedServiceId === s.id
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedServiceId(s.id)
                }}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-white/10 bg-white/5 hover:bg-white/10',
                )}
              >
                <span className="font-medium">{s.title}</span>
                {s.description ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{s.description}</p>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
      <Button
        type="button"
        disabled={selectedServiceId == null || status === 'ensuring'}
        onClick={() => void onContinue()}
      >
        {status === 'ensuring' ? 'Starting…' : 'Continue'}
      </Button>
    </div>
  )
}
