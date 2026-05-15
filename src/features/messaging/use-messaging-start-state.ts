import { useCallback, useEffect, useState } from 'react'

import { ensureMessagingConversation, fetchActiveServicesForProfessional } from './messaging.service'
import type { ServiceOption } from './messaging.types'

type StartStatus = 'idle' | 'loading' | 'ready' | 'ensuring' | 'error'

export function useMessagingStartState(professionalId: number | null) {
  const [services, setServices] = useState<ServiceOption[]>([])
  const [status, setStatus] = useState<StartStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const loadServices = useCallback(async () => {
    if (professionalId == null) {
      setServices([])
      setStatus('idle')
      setError(null)
      setSelectedServiceId(null)
      return
    }
    setStatus('loading')
    setError(null)
    const { data, error: err } = await fetchActiveServicesForProfessional(professionalId)
    if (err) {
      setStatus('error')
      setError(err.message)
      setServices([])
      setSelectedServiceId(null)
      return
    }
    const list = data ?? []
    setServices(list)
    if (list.length === 1) {
      setSelectedServiceId(list[0].id)
    } else {
      setSelectedServiceId(null)
    }
    setStatus('ready')
  }, [professionalId])

  useEffect(() => {
    queueMicrotask(() => {
      void loadServices()
    })
  }, [loadServices])

  const ensureConversation = useCallback(
    async (serviceId: number) => {
      if (professionalId == null) {
        return { conversationId: null as number | null, error: new Error('Missing professional.') }
      }
      setStatus('ensuring')
      setError(null)
      const { conversationId, error: err } = await ensureMessagingConversation(
        professionalId,
        serviceId,
      )
      if (err) {
        setStatus('error')
        setError(err.message)
        return { conversationId: null, error: err }
      }
      setStatus('ready')
      return { conversationId, error: null }
    },
    [professionalId],
  )

  return {
    services,
    status,
    error,
    selectedServiceId,
    setSelectedServiceId,
    reload: loadServices,
    ensureConversation,
    clearError,
  }
}
