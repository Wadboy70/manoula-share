import { supabase } from '@/lib/supabaseClient'

import type {
  AvailabilityExceptionRow,
  AvailabilityRuleRow,
  ExceptionDraft,
  WeeklyRuleDraft,
} from './availability.types'

export async function fetchAvailabilityRules(
  professionalId: number,
): Promise<{ data: AvailabilityRuleRow[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('professional_availability_rules')
    .select('*')
    .eq('professional_id', professionalId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) return { data: null, error: new Error(error.message) }
  return { data: data ?? [], error: null }
}

export async function fetchAvailabilityExceptions(
  professionalId: number,
): Promise<{ data: AvailabilityExceptionRow[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('professional_availability_exceptions')
    .select('*')
    .eq('professional_id', professionalId)
    .order('exception_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true })

  if (error) return { data: null, error: new Error(error.message) }
  return { data: data ?? [], error: null }
}

export async function fetchPublicAvailability(
  professionalId: number,
): Promise<{
  rules: AvailabilityRuleRow[] | null
  exceptions: AvailabilityExceptionRow[] | null
  error: Error | null
}> {
  const [rulesResult, exceptionsResult] = await Promise.all([
    fetchAvailabilityRules(professionalId),
    fetchAvailabilityExceptions(professionalId),
  ])

  if (rulesResult.error) return { rules: null, exceptions: null, error: rulesResult.error }
  if (exceptionsResult.error) {
    return { rules: null, exceptions: null, error: exceptionsResult.error }
  }

  return {
    rules: rulesResult.data,
    exceptions: exceptionsResult.data,
    error: null,
  }
}

export async function createAvailabilityRule(
  professionalId: number,
  draft: WeeklyRuleDraft,
): Promise<{ data: AvailabilityRuleRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('professional_availability_rules')
    .insert({
      professional_id: professionalId,
      day_of_week: draft.dayOfWeek,
      start_time: draft.startTime,
      end_time: draft.endTime,
    })
    .select('*')
    .single()

  if (error) return { data: null, error: new Error(error.message) }
  return { data, error: null }
}

export async function deleteAvailabilityRule(
  ruleId: number,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('professional_availability_rules').delete().eq('id', ruleId)
  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export async function createAvailabilityException(
  professionalId: number,
  draft: ExceptionDraft,
): Promise<{ data: AvailabilityExceptionRow | null; error: Error | null }> {
  const startTime = draft.startTime.trim() ? draft.startTime : null
  const endTime = draft.endTime.trim() ? draft.endTime : null

  const { data, error } = await supabase
    .from('professional_availability_exceptions')
    .insert({
      professional_id: professionalId,
      exception_date: draft.exceptionDate,
      kind: draft.kind,
      start_time: startTime,
      end_time: endTime,
    })
    .select('*')
    .single()

  if (error) return { data: null, error: new Error(error.message) }
  return { data, error: null }
}

export async function deleteAvailabilityException(
  exceptionId: number,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('professional_availability_exceptions')
    .delete()
    .eq('id', exceptionId)

  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export async function fetchProfessionalScheduledBookings(
  professionalId: number,
): Promise<{
  data: { scheduled_at: string; duration_minutes: number | null; status: 'pending' | 'accepted' }[] | null
  error: Error | null
}> {
  const { data, error } = await supabase
    .from('bookings')
    .select('scheduled_at, status, services ( duration_minutes )')
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'accepted'])
    .not('scheduled_at', 'is', null)

  if (error) return { data: null, error: new Error(error.message) }

  const rows = (data ?? [])
    .filter((row) => row.scheduled_at != null)
    .map((row) => {
      const service = row.services
      const duration =
        service && !Array.isArray(service) ? service.duration_minutes : null
      return {
        scheduled_at: row.scheduled_at as string,
        duration_minutes: duration,
        status: row.status as 'pending' | 'accepted',
      }
    })

  return { data: rows, error: null }
}

export function validateWeeklyRuleDraft(draft: WeeklyRuleDraft): string | null {
  if (draft.dayOfWeek < 1 || draft.dayOfWeek > 7) return 'Choose a day of the week.'
  if (!draft.startTime || !draft.endTime) return 'Start and end times are required.'
  if (draft.endTime <= draft.startTime) return 'End time must be after start time.'
  return null
}

export function validateExceptionDraft(draft: ExceptionDraft, minDate: string): string | null {
  if (!draft.exceptionDate) return 'Choose a date.'
  if (draft.exceptionDate < minDate) return 'Date cannot be in the past.'
  const hasStart = draft.startTime.trim().length > 0
  const hasEnd = draft.endTime.trim().length > 0
  if (hasStart !== hasEnd) return 'Provide both start and end times, or leave both blank for all day.'
  if (hasStart && hasEnd && draft.endTime <= draft.startTime) {
    return 'End time must be after start time.'
  }
  return null
}
