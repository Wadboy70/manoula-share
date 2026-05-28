import { useCallback, useEffect, useState } from 'react'

import {
  createAvailabilityException,
  createAvailabilityRule,
  deleteAvailabilityException,
  deleteAvailabilityRule,
  fetchAvailabilityExceptions,
  fetchAvailabilityRules,
  fetchProfessionalScheduledBookings,
  validateExceptionDraft,
  validateWeeklyRuleDraft,
} from './availability.service'
import type {
  AvailabilityExceptionRow,
  AvailabilityRuleRow,
  ExceptionDraft,
  WeeklyRuleDraft,
} from './availability.types'
import { AVAILABILITY_HORIZON_DAYS, DEFAULT_SLOT_DURATION_MINUTES } from './availability.types'
import { todayDateInputValue } from './availability-format'
import { generateBookableSlots } from './slot-generation'

type EditorState = {
  loading: boolean
  saving: boolean
  error: string | null
  success: string | null
  rules: AvailabilityRuleRow[]
  exceptions: AvailabilityExceptionRow[]
  previewSlotCount: number
}

const emptyWeeklyDraft = (): WeeklyRuleDraft => ({
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '17:00',
})

const emptyExceptionDraft = (): ExceptionDraft => ({
  exceptionDate: todayDateInputValue(),
  kind: 'unavailable',
  startTime: '',
  endTime: '',
})

export function useAvailabilityEditor(professionalId: number | undefined) {
  const [state, setState] = useState<EditorState>({
    loading: true,
    saving: false,
    error: null,
    success: null,
    rules: [],
    exceptions: [],
    previewSlotCount: 0,
  })
  const [weeklyDraft, setWeeklyDraft] = useState<WeeklyRuleDraft>(emptyWeeklyDraft)
  const [exceptionDraft, setExceptionDraft] = useState<ExceptionDraft>(emptyExceptionDraft)

  const reload = useCallback(async () => {
    if (professionalId == null) {
      setState((prev) => ({ ...prev, loading: false, rules: [], exceptions: [], previewSlotCount: 0 }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))
    const [rulesResult, exceptionsResult, bookingsResult] = await Promise.all([
      fetchAvailabilityRules(professionalId),
      fetchAvailabilityExceptions(professionalId),
      fetchProfessionalScheduledBookings(professionalId),
    ])

    if (rulesResult.error || exceptionsResult.error || bookingsResult.error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          rulesResult.error?.message ??
          exceptionsResult.error?.message ??
          bookingsResult.error?.message ??
          'Failed to load availability.',
      }))
      return
    }

    const rules = rulesResult.data ?? []
    const exceptions = exceptionsResult.data ?? []
    const previewSlotCount = generateBookableSlots({
      rules,
      exceptions,
      durationMinutes: DEFAULT_SLOT_DURATION_MINUTES,
      existingBookings: bookingsResult.data ?? [],
      horizonDays: AVAILABILITY_HORIZON_DAYS,
    }).length

    setState({
      loading: false,
      saving: false,
      error: null,
      success: null,
      rules,
      exceptions,
      previewSlotCount,
    })
  }, [professionalId])

  useEffect(() => {
    queueMicrotask(() => {
      void reload()
    })
  }, [reload])

  const addWeeklyRule = useCallback(async () => {
    if (professionalId == null) return
    const validationError = validateWeeklyRuleDraft(weeklyDraft)
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError, success: null }))
      return
    }

    setState((prev) => ({ ...prev, saving: true, error: null, success: null }))
    const { error } = await createAvailabilityRule(professionalId, weeklyDraft)
    if (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message }))
      return
    }
    setWeeklyDraft(emptyWeeklyDraft())
    await reload()
    setState((prev) => ({ ...prev, saving: false, success: 'Weekly availability added.' }))
  }, [professionalId, weeklyDraft, reload])

  const removeWeeklyRule = useCallback(
    async (ruleId: number) => {
      setState((prev) => ({ ...prev, saving: true, error: null, success: null }))
      const { error } = await deleteAvailabilityRule(ruleId)
      if (error) {
        setState((prev) => ({ ...prev, saving: false, error: error.message }))
        return
      }
      await reload()
      setState((prev) => ({ ...prev, saving: false, success: 'Weekly availability removed.' }))
    },
    [reload],
  )

  const addException = useCallback(async () => {
    if (professionalId == null) return
    const validationError = validateExceptionDraft(exceptionDraft, todayDateInputValue())
    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError, success: null }))
      return
    }

    setState((prev) => ({ ...prev, saving: true, error: null, success: null }))
    const { error } = await createAvailabilityException(professionalId, exceptionDraft)
    if (error) {
      setState((prev) => ({ ...prev, saving: false, error: error.message }))
      return
    }
    setExceptionDraft(emptyExceptionDraft())
    await reload()
    setState((prev) => ({ ...prev, saving: false, success: 'Date exception added.' }))
  }, [professionalId, exceptionDraft, reload])

  const removeException = useCallback(
    async (exceptionId: number) => {
      setState((prev) => ({ ...prev, saving: true, error: null, success: null }))
      const { error } = await deleteAvailabilityException(exceptionId)
      if (error) {
        setState((prev) => ({ ...prev, saving: false, error: error.message }))
        return
      }
      await reload()
      setState((prev) => ({ ...prev, saving: false, success: 'Date exception removed.' }))
    },
    [reload],
  )

  return {
    ...state,
    weeklyDraft,
    setWeeklyDraft,
    exceptionDraft,
    setExceptionDraft,
    addWeeklyRule,
    removeWeeklyRule,
    addException,
    removeException,
    reload,
  }
}
