import { useCallback, useEffect, useState } from 'react'

import {
  fetchProfessionalScheduledBookings,
  fetchPublicAvailability,
} from './availability.service'
import type { BookableSlot } from './availability.types'
import { AVAILABILITY_HORIZON_DAYS } from './availability.types'
import { generateBookableSlots } from './slot-generation'

type BookableSlotsState = {
  loading: boolean
  error: string | null
  slots: BookableSlot[]
}

export function useBookableSlots(
  professionalId: number | null,
  durationMinutes: number,
) {
  const [state, setState] = useState<BookableSlotsState>({
    loading: false,
    error: null,
    slots: [],
  })

  const reload = useCallback(async () => {
    if (professionalId == null) {
      setState({ loading: false, error: null, slots: [] })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))
    const { rules, exceptions, error } = await fetchPublicAvailability(professionalId)
    if (error) {
      setState({ loading: false, error: error.message, slots: [] })
      return
    }

    const bookingsResult = await fetchProfessionalScheduledBookings(professionalId)
    if (bookingsResult.error) {
      setState({ loading: false, error: bookingsResult.error.message, slots: [] })
      return
    }

    const slots = generateBookableSlots({
      rules: rules ?? [],
      exceptions: exceptions ?? [],
      durationMinutes,
      existingBookings: bookingsResult.data ?? [],
      horizonDays: AVAILABILITY_HORIZON_DAYS,
    })

    setState({ loading: false, error: null, slots })
  }, [professionalId, durationMinutes])

  useEffect(() => {
    queueMicrotask(() => {
      void reload()
    })
  }, [reload])

  return { ...state, reload }
}

export function groupSlotsByDate(slots: BookableSlot[]): Map<string, BookableSlot[]> {
  const grouped = new Map<string, BookableSlot[]>()
  for (const slot of slots) {
    const list = grouped.get(slot.dateKey) ?? []
    list.push(slot)
    grouped.set(slot.dateKey, list)
  }
  return grouped
}
