import type { Database } from '@/types/database'

export type AvailabilityRuleRow =
  Database['public']['Tables']['professional_availability_rules']['Row']

export type AvailabilityExceptionRow =
  Database['public']['Tables']['professional_availability_exceptions']['Row']

export type AvailabilityExceptionKind =
  Database['public']['Enums']['availability_exception_kind']

export type WeeklyRuleDraft = {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export type ExceptionDraft = {
  exceptionDate: string
  kind: AvailabilityExceptionKind
  startTime: string
  endTime: string
}

export type BookableSlot = {
  startsAt: string
  dateKey: string
  label: string
}

export type ScheduledBookingBlock = {
  scheduled_at: string
  duration_minutes: number | null
  status: 'pending' | 'accepted'
}

export type GenerateBookableSlotsInput = {
  rules: AvailabilityRuleRow[]
  exceptions: AvailabilityExceptionRow[]
  durationMinutes: number
  existingBookings: ScheduledBookingBlock[]
  horizonDays?: number
  now?: Date
}

export const AVAILABILITY_HORIZON_DAYS = 28
export const DEFAULT_SLOT_DURATION_MINUTES = 60

export const ISO_WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]
