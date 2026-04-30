import { describe, expect, it } from 'vitest'

import {
  formatCentsToGbpPriceInput,
  isValidGbpPriceInput,
  parseGbpPriceInputToCents,
  sanitizeServiceDraft,
} from './service-validation'
import type { ServiceDraft } from './service.types'

function makeDraft(): ServiceDraft {
  return {
    title: '  New service  ',
    description: '  <b>desc</b>  ',
    priceCents: 1000,
    currencyCode: 'gbp',
    durationMinutes: 45,
    specialtyId: null,
    deliveryMode: 'remote',
    remoteScope: 'anywhere',
    serviceAreaType: null,
    serviceRadiusKm: null,
    serviceAreaText: '  area text  ',
    isActive: true,
    providerLocations: [],
    serviceAreaPlaces: [],
  }
}

describe('sanitizeServiceDraft', () => {
  it('normalizes text values and uppercases currency', () => {
    const sanitized = sanitizeServiceDraft(makeDraft())
    expect(sanitized.title).toBe('New service')
    expect(sanitized.description).toBe('desc')
    expect(sanitized.currencyCode).toBe('GBP')
    expect(sanitized.serviceAreaText).toBe('area text')
  })
})

describe('GBP price helpers', () => {
  it('accepts valid decimal formats', () => {
    expect(isValidGbpPriceInput('75')).toBe(true)
    expect(isValidGbpPriceInput('75.5')).toBe(true)
    expect(isValidGbpPriceInput('75.50')).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(isValidGbpPriceInput('75.555')).toBe(false)
    expect(isValidGbpPriceInput('abc')).toBe(false)
    expect(isValidGbpPriceInput('12.3.4')).toBe(false)
  })

  it('parses and formats cents correctly', () => {
    expect(parseGbpPriceInputToCents('75.50')).toBe(7550)
    expect(parseGbpPriceInputToCents('75')).toBe(7500)
    expect(formatCentsToGbpPriceInput(7550)).toBe('75.50')
    expect(formatCentsToGbpPriceInput(7500)).toBe('75')
  })
})
