import {
  AVAILABILITY_HORIZON_DAYS,
  DEFAULT_SLOT_DURATION_MINUTES,
  type AvailabilityExceptionRow,
  type AvailabilityRuleRow,
  type BookableSlot,
  type GenerateBookableSlotsInput,
  type ScheduledBookingBlock,
} from './availability.types'

type TimeWindow = {
  startMinutes: number
  endMinutes: number
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function isoDayOfWeek(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function combineDateAndMinutes(dateKey: string, minutes: number): Date {
  const date = parseDateKey(dateKey)
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date
}

function subtractWindow(windows: TimeWindow[], block: TimeWindow): TimeWindow[] {
  const next: TimeWindow[] = []
  for (const window of windows) {
    if (block.endMinutes <= window.startMinutes || block.startMinutes >= window.endMinutes) {
      next.push(window)
      continue
    }
    if (block.startMinutes > window.startMinutes) {
      next.push({ startMinutes: window.startMinutes, endMinutes: block.startMinutes })
    }
    if (block.endMinutes < window.endMinutes) {
      next.push({ startMinutes: block.endMinutes, endMinutes: window.endMinutes })
    }
  }
  return next.filter((w) => w.endMinutes > w.startMinutes)
}

function addWindow(windows: TimeWindow[], addition: TimeWindow): TimeWindow[] {
  return [...windows, addition]
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .reduce<TimeWindow[]>((merged, current) => {
      const last = merged.at(-1)
      if (!last) return [current]
      if (current.startMinutes <= last.endMinutes) {
        last.endMinutes = Math.max(last.endMinutes, current.endMinutes)
        return merged
      }
      merged.push(current)
      return merged
    }, [])
}

function windowsForDate(
  dateKey: string,
  rules: AvailabilityRuleRow[],
  exceptions: AvailabilityExceptionRow[],
): TimeWindow[] {
  const date = parseDateKey(dateKey)
  const isoDow = isoDayOfWeek(date)
  const dateExceptions = exceptions.filter((e) => e.exception_date === dateKey)

  const fullDayUnavailable = dateExceptions.some(
    (e) => e.kind === 'unavailable' && e.start_time == null && e.end_time == null,
  )
  if (fullDayUnavailable) return []

  let windows: TimeWindow[] = rules
    .filter((r) => r.day_of_week === isoDow)
    .map((r) => ({
      startMinutes: parseTimeToMinutes(r.start_time),
      endMinutes: parseTimeToMinutes(r.end_time),
    }))

  for (const exception of dateExceptions) {
    if (exception.kind === 'unavailable' && exception.start_time && exception.end_time) {
      windows = subtractWindow(windows, {
        startMinutes: parseTimeToMinutes(exception.start_time),
        endMinutes: parseTimeToMinutes(exception.end_time),
      })
    }
  }

  for (const exception of dateExceptions) {
    if (exception.kind === 'available') {
      if (exception.start_time == null || exception.end_time == null) {
        windows = [{ startMinutes: 0, endMinutes: 24 * 60 }]
      } else {
        windows = addWindow(windows, {
          startMinutes: parseTimeToMinutes(exception.start_time),
          endMinutes: parseTimeToMinutes(exception.end_time),
        })
      }
    }
  }

  return windows
}

function sliceWindowsIntoSlots(
  dateKey: string,
  windows: TimeWindow[],
  durationMinutes: number,
): Date[] {
  const slots: Date[] = []
  for (const window of windows) {
    let cursor = window.startMinutes
    while (cursor + durationMinutes <= window.endMinutes) {
      slots.push(combineDateAndMinutes(dateKey, cursor))
      cursor += durationMinutes
    }
  }
  return slots
}

function bookingBlocks(bookings: ScheduledBookingBlock[]): { start: Date; end: Date }[] {
  return bookings
    .filter((b) => b.status === 'pending' || b.status === 'accepted')
    .filter((b) => b.scheduled_at)
    .map((b) => {
      const start = new Date(b.scheduled_at)
      const duration = b.duration_minutes ?? DEFAULT_SLOT_DURATION_MINUTES
      const end = new Date(start.getTime() + duration * 60_000)
      return { start, end }
    })
}

function slotConflictsBooking(slotStart: Date, slotEnd: Date, blocks: { start: Date; end: Date }[]): boolean {
  return blocks.some((b) => slotStart < b.end && slotEnd > b.start)
}

function formatSlotLabel(start: Date): string {
  return start.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function generateBookableSlots(input: GenerateBookableSlotsInput): BookableSlot[] {
  const {
    rules,
    exceptions,
    durationMinutes = DEFAULT_SLOT_DURATION_MINUTES,
    existingBookings,
    horizonDays = AVAILABILITY_HORIZON_DAYS,
    now = new Date(),
  } = input

  const duration = Math.max(durationMinutes, 1)
  const blocks = bookingBlocks(existingBookings)
  const slots: BookableSlot[] = []

  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + offset)
    const dateKey = formatDateKey(date)
    const windows = windowsForDate(dateKey, rules, exceptions)
    const candidates = sliceWindowsIntoSlots(dateKey, windows, duration)

    for (const slotStart of candidates) {
      if (slotStart <= now) continue
      const slotEnd = new Date(slotStart.getTime() + duration * 60_000)
      if (slotConflictsBooking(slotStart, slotEnd, blocks)) continue
      slots.push({
        startsAt: slotStart.toISOString(),
        dateKey,
        label: formatSlotLabel(slotStart),
      })
    }
  }

  return slots
}
