import { describe, expect, it } from 'vitest'

import type { AvailabilityExceptionRow, AvailabilityRuleRow } from './availability.types'
import {
  formatDateKey,
  generateBookableSlots,
  isoDayOfWeek,
  parseTimeToMinutes,
} from './slot-generation'

function makeRule(overrides: Partial<AvailabilityRuleRow> = {}): AvailabilityRuleRow {
  return {
    id: 1,
    professional_id: 10,
    day_of_week: 1,
    start_time: '09:00:00',
    end_time: '12:00:00',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeException(overrides: Partial<AvailabilityExceptionRow> = {}): AvailabilityExceptionRow {
  return {
    id: 1,
    professional_id: 10,
    exception_date: '2026-06-08',
    kind: 'unavailable',
    start_time: null,
    end_time: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('parseTimeToMinutes', () => {
  it('parses HH:MM times', () => {
    expect(parseTimeToMinutes('09:00')).toBe(540)
    expect(parseTimeToMinutes('17:30')).toBe(1050)
  })
})

describe('isoDayOfWeek', () => {
  it('returns ISO weekday (Mon=1, Sun=7)', () => {
    expect(isoDayOfWeek(new Date(2026, 5, 8))).toBe(1)
    expect(isoDayOfWeek(new Date(2026, 5, 14))).toBe(7)
  })
})

describe('generateBookableSlots', () => {
  const now = new Date(2026, 5, 8, 8, 0, 0)

  it('generates duration-sized slots from weekly rules', () => {
    const slots = generateBookableSlots({
      rules: [makeRule({ day_of_week: 1, start_time: '09:00:00', end_time: '11:00:00' })],
      exceptions: [],
      durationMinutes: 60,
      existingBookings: [],
      now,
      horizonDays: 0,
    })

    expect(slots).toHaveLength(2)
    expect(slots[0]?.dateKey).toBe(formatDateKey(now))
    expect(slots[0]?.startsAt).toContain('T')
  })

  it('removes slots blocked by full-day unavailable exception', () => {
    const dateKey = formatDateKey(now)
    const slots = generateBookableSlots({
      rules: [makeRule({ day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00' })],
      exceptions: [makeException({ exception_date: dateKey, kind: 'unavailable' })],
      durationMinutes: 60,
      existingBookings: [],
      now,
      horizonDays: 0,
    })

    expect(slots).toHaveLength(0)
  })

  it('subtracts partial unavailable exceptions', () => {
    const dateKey = formatDateKey(now)
    const slots = generateBookableSlots({
      rules: [makeRule({ day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00' })],
      exceptions: [
        makeException({
          exception_date: dateKey,
          kind: 'unavailable',
          start_time: '10:00:00',
          end_time: '11:00:00',
        }),
      ],
      durationMinutes: 60,
      existingBookings: [],
      now,
      horizonDays: 0,
    })

    expect(slots).toHaveLength(2)
    const hours = slots.map((s) => new Date(s.startsAt).getHours())
    expect(hours).toEqual([9, 11])
  })

  it('adds extra availability windows from exceptions', () => {
    const wednesday = new Date(2026, 5, 10, 8, 0, 0)
    const dateKey = formatDateKey(wednesday)
    const slots = generateBookableSlots({
      rules: [],
      exceptions: [
        makeException({
          exception_date: dateKey,
          kind: 'available',
          start_time: '14:00:00',
          end_time: '16:00:00',
        }),
      ],
      durationMinutes: 60,
      existingBookings: [],
      now: wednesday,
      horizonDays: 0,
    })

    expect(slots).toHaveLength(2)
  })

  it('filters past slots', () => {
    const lateNow = new Date(2026, 5, 8, 10, 30, 0)
    const slots = generateBookableSlots({
      rules: [makeRule({ day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00' })],
      exceptions: [],
      durationMinutes: 60,
      existingBookings: [],
      now: lateNow,
      horizonDays: 0,
    })

    expect(slots.every((s) => new Date(s.startsAt) > lateNow)).toBe(true)
    expect(slots).toHaveLength(1)
  })

  it('filters slots that conflict with pending or accepted bookings', () => {
    const slots = generateBookableSlots({
      rules: [makeRule({ day_of_week: 1, start_time: '09:00:00', end_time: '12:00:00' })],
      exceptions: [],
      durationMinutes: 60,
      existingBookings: [
        {
          scheduled_at: new Date(2026, 5, 8, 10, 0, 0).toISOString(),
          duration_minutes: 60,
          status: 'pending',
        },
      ],
      now,
      horizonDays: 0,
    })

    const hours = slots.map((s) => new Date(s.startsAt).getHours())
    expect(hours).not.toContain(10)
    expect(hours).toEqual([9, 11])
  })

  it('ignores declined bookings when filtering conflicts', () => {
    const slots = generateBookableSlots({
      rules: [makeRule({ day_of_week: 1, start_time: '09:00:00', end_time: '11:00:00' })],
      exceptions: [],
      durationMinutes: 60,
      existingBookings: [
        {
          scheduled_at: new Date(2026, 5, 8, 9, 0, 0).toISOString(),
          duration_minutes: 60,
          status: 'declined' as 'pending',
        },
      ],
      now,
      horizonDays: 0,
    })

    expect(slots).toHaveLength(2)
  })
})
