import { describe, expect, it } from 'vitest'

import { validateExceptionDraft, validateWeeklyRuleDraft } from './availability.service'

describe('validateWeeklyRuleDraft', () => {
  it('accepts valid weekly windows', () => {
    expect(
      validateWeeklyRuleDraft({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }),
    ).toBeNull()
  })

  it('rejects end before start', () => {
    expect(
      validateWeeklyRuleDraft({ dayOfWeek: 1, startTime: '12:00', endTime: '09:00' }),
    ).toMatch(/after start/i)
  })
})

describe('validateExceptionDraft', () => {
  it('accepts all-day exceptions without times', () => {
    expect(
      validateExceptionDraft(
        { exceptionDate: '2026-06-10', kind: 'unavailable', startTime: '', endTime: '' },
        '2026-06-01',
      ),
    ).toBeNull()
  })

  it('rejects partial time pairs', () => {
    expect(
      validateExceptionDraft(
        { exceptionDate: '2026-06-10', kind: 'available', startTime: '14:00', endTime: '' },
        '2026-06-01',
      ),
    ).toMatch(/both start and end/i)
  })

  it('rejects past dates', () => {
    expect(
      validateExceptionDraft(
        { exceptionDate: '2026-05-01', kind: 'unavailable', startTime: '', endTime: '' },
        '2026-06-01',
      ),
    ).toMatch(/past/i)
  })
})
