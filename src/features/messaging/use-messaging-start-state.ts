import { useCallback, useEffect, useMemo, useState } from 'react'

import { DEFAULT_SLOT_DURATION_MINUTES } from '@/features/availability/availability.types'
import { useBookableSlots } from '@/features/availability/use-bookable-slots'

import { ensureMessagingConversation, fetchActiveServicesForProfessional } from './messaging.service'
import type { ServiceOption } from './messaging.types'

type StartStep = 'loading' | 'service' | 'time' | 'ensuring' | 'error'

export function useMessagingStartState(professionalId: number | null) {
  const [services, setServices] = useState<ServiceOption[]>([])
  const [step, setStep] = useState<StartStep>('loading')
  const [error, setError] = useState<string | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  )

  const durationMinutes = selectedService?.duration_minutes ?? DEFAULT_SLOT_DURATION_MINUTES

  const {
    loading: slotsLoading,
    error: slotsError,
    slots,
    reload: reloadSlots,
  } = useBookableSlots(professionalId, durationMinutes)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const loadServices = useCallback(async () => {
    if (professionalId == null) {
      setServices([])
      setStep('loading')
      setError(null)
      setSelectedServiceId(null)
      setSelectedSlot(null)
      return
    }
    setStep('loading')
    setError(null)
    const { data, error: err } = await fetchActiveServicesForProfessional(professionalId)
    if (err) {
      setStep('error')
      setError(err.message)
      setServices([])
      setSelectedServiceId(null)
      setSelectedSlot(null)
      return
    }
    const list = data ?? []
    setServices(list)
    if (list.length === 1) {
      setSelectedServiceId(list[0].id)
      setStep('time')
    } else if (list.length > 1) {
      setSelectedServiceId(null)
      setStep('service')
    } else {
      setSelectedServiceId(null)
      setStep('service')
    }
    setSelectedSlot(null)
  }, [professionalId])

  useEffect(() => {
    queueMicrotask(() => {
      void loadServices()
    })
  }, [loadServices])

  const continueToTimeStep = useCallback((serviceId: number) => {
    setSelectedServiceId(serviceId)
    setSelectedSlot(null)
    setStep('time')
    setError(null)
  }, [])

  const backToServiceStep = useCallback(() => {
    setStep('service')
    setError(null)
  }, [])

  const ensureConversation = useCallback(
    async (serviceId: number, scheduledAt?: string | null) => {
      if (professionalId == null) {
        return { conversationId: null as number | null, error: new Error('Missing professional.') }
      }
      setStep('ensuring')
      setError(null)
      const { conversationId, error: err } = await ensureMessagingConversation(
        professionalId,
        serviceId,
        scheduledAt,
      )
      if (err) {
        setStep('time')
        setError(err.message)
        return { conversationId: null, error: err }
      }
      setStep('time')
      return { conversationId, error: null }
    },
    [professionalId],
  )

  return {
    services,
    step,
    error: error ?? slotsError,
    selectedServiceId,
    selectedService,
    selectedSlot,
    setSelectedServiceId,
    setSelectedSlot,
    slots,
    slotsLoading,
    reload: loadServices,
    reloadSlots,
    continueToTimeStep,
    backToServiceStep,
    ensureConversation,
    clearError,
  }
}
