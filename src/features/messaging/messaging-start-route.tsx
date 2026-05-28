import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { groupSlotsByDate } from '@/features/availability/use-bookable-slots'
import { parseDateKey } from '@/features/availability/slot-generation'
import { cn } from '@/lib/utils'

import { useMessagingStartState } from './use-messaging-start-state'
import type { ServiceOption } from './messaging.types'

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
    step,
    error,
    selectedServiceId,
    selectedService,
    selectedSlot,
    setSelectedServiceId,
    setSelectedSlot,
    slots,
    slotsLoading,
    reload,
    continueToTimeStep,
    backToServiceStep,
    ensureConversation,
    clearError,
  } = useMessagingStartState(professionalId)

  if (step === 'loading') {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
        Loading services…
      </div>
    )
  }

  if (step === 'error' && services.length === 0) {
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

  if (step === 'service') {
    return (
      <ServiceStep
        services={services}
        selectedServiceId={selectedServiceId}
        error={error}
        onSelect={setSelectedServiceId}
        onContinue={() => {
          if (selectedServiceId == null) return
          continueToTimeStep(selectedServiceId)
        }}
      />
    )
  }

  if (step === 'ensuring') {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
        Sending your request…
      </div>
    )
  }

  const groupedSlots = groupSlotsByDate(slots)

  async function submitRequest(scheduledAt: string | null) {
    if (selectedServiceId == null) return
    const { conversationId } = await ensureConversation(selectedServiceId, scheduledAt)
    if (conversationId != null) {
      navigate(`/messages/${conversationId}`, { replace: true })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h2 className="text-foreground font-heading text-xl">Choose a time</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {selectedService
            ? `Request a session for ${selectedService.title}. Your provider will confirm the time.`
            : 'Select when you would like to meet. Your provider will confirm the time.'}
        </p>
      </div>

      {services.length > 1 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => {
            clearError()
            setSelectedSlot(null)
            backToServiceStep()
          }}
        >
          ← Change service
        </Button>
      ) : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {slotsLoading ? (
        <p className="text-muted-foreground text-sm">Loading available times…</p>
      ) : slots.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-muted-foreground text-sm">
            No open times in the next few weeks. You can still send a request without picking a
            time.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void submitRequest(null)
            }}
          >
            Continue without a time
          </Button>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {[...groupedSlots.entries()].map(([dateKey, dateSlots]) => {
              const dateLabel = parseDateKey(dateKey).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })
              return (
                <section key={dateKey} aria-label={dateLabel}>
                  <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                    {dateLabel}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {dateSlots.map((slot) => {
                      const selected = selectedSlot === slot.startsAt
                      return (
                        <li key={slot.startsAt}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot.startsAt)
                            }}
                            className={cn(
                              'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                              selected
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-white/10 bg-white/5 hover:bg-white/10',
                            )}
                          >
                            {slot.label}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              disabled={selectedSlot == null}
              onClick={() => {
                if (selectedSlot == null) return
                void submitRequest(selectedSlot)
              }}
            >
              Request this time
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void submitRequest(null)
              }}
            >
              Continue without a time
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

type ServiceStepProps = {
  services: ServiceOption[]
  selectedServiceId: number | null
  error: string | null
  onSelect: (serviceId: number) => void
  onContinue: () => void
}

function ServiceStep({
  services,
  selectedServiceId,
  error,
  onSelect,
  onContinue,
}: ServiceStepProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h2 className="text-foreground font-heading text-xl">Choose a service</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Select the consultation you would like to book.
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {services.map((service) => {
          const selected = selectedServiceId === service.id
          return (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(service.id)
                }}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-white/10 bg-white/5 hover:bg-white/10',
                )}
              >
                <span className="font-medium">{service.title}</span>
                {service.description ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{service.description}</p>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
      <Button type="button" disabled={selectedServiceId == null} onClick={onContinue}>
        Continue
      </Button>
    </div>
  )
}
