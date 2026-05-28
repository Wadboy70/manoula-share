import { ISO_WEEKDAY_OPTIONS, type AvailabilityExceptionKind, type AvailabilityExceptionRow, type AvailabilityRuleRow } from './availability.types'
import { parseDateKey } from './slot-generation'

export function weekdayLabel(dayOfWeek: number): string {
  return ISO_WEEKDAY_OPTIONS.find((d) => d.value === dayOfWeek)?.label ?? `Day ${dayOfWeek}`
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTimeDisplay(startTime)}–${formatTimeDisplay(endTime)}`
}

export function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date(2000, 0, 1, hours, minutes)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatWeeklyRuleLabel(rule: AvailabilityRuleRow): string {
  return `${weekdayLabel(rule.day_of_week)} · ${formatTimeRange(rule.start_time, rule.end_time)}`
}

export function formatExceptionKind(kind: AvailabilityExceptionKind): string {
  return kind === 'unavailable' ? 'Unavailable' : 'Extra hours'
}

export function formatExceptionLabel(exception: AvailabilityExceptionRow): string {
  const date = parseDateKey(exception.exception_date)
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const kindLabel = formatExceptionKind(exception.kind)
  if (exception.start_time == null || exception.end_time == null) {
    return `${dateLabel} · ${kindLabel} (all day)`
  }
  return `${dateLabel} · ${kindLabel} · ${formatTimeRange(exception.start_time, exception.end_time)}`
}

export function todayDateInputValue(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
