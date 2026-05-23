import { describe, expect, it } from 'vitest'

import {
  buildPathWithSearch,
  buildPathWithSearchParam,
  defineSearchParam,
  parseSearchParam,
  patchSearchParams,
  searchParamCodecs,
} from '@/lib/search-params'

const testIdParam = defineSearchParam('item', searchParamCodecs.positiveInt)

describe('search-param codecs', () => {
  it('parses positive integers', () => {
    expect(searchParamCodecs.positiveInt.parse('12')).toBe(12)
    expect(searchParamCodecs.positiveInt.parse('0')).toBeNull()
    expect(searchParamCodecs.positiveInt.parse('x')).toBeNull()
  })
})

describe('buildPathWithSearch', () => {
  it('omits empty values and builds query string', () => {
    expect(buildPathWithSearch('/list', { a: 1, b: null, c: '' })).toBe('/list?a=1')
    expect(buildPathWithSearch('/list', {})).toBe('/list')
  })
})

describe('buildPathWithSearchParam', () => {
  it('serializes via codec', () => {
    expect(buildPathWithSearchParam('/list', testIdParam, 7)).toBe('/list?item=7')
    expect(buildPathWithSearchParam('/list', testIdParam, null)).toBe('/list')
  })
})

describe('patchSearchParams', () => {
  it('sets and deletes keys', () => {
    const base = new URLSearchParams('foo=1')
    expect(patchSearchParams(base, 'bar', '2').toString()).toBe('foo=1&bar=2')
    expect(patchSearchParams(base, 'foo', null).toString()).toBe('')
  })
})

describe('parseSearchParam', () => {
  it('uses defined param codec', () => {
    expect(parseSearchParam(testIdParam, '3')).toBe(3)
  })
})
