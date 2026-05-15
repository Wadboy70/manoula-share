import { describe, expect, it } from 'vitest'

import { isMessageBodyValid } from './message-composer.validation'

describe('isMessageBodyValid', () => {
  it('rejects blank and whitespace-only', () => {
    expect(isMessageBodyValid('')).toBe(false)
    expect(isMessageBodyValid('   ')).toBe(false)
    expect(isMessageBodyValid('\n\t')).toBe(false)
  })

  it('accepts non-empty trimmed content within max length', () => {
    expect(isMessageBodyValid('hello')).toBe(true)
    expect(isMessageBodyValid('  hi  ')).toBe(true)
  })

  it('rejects content over 8000 characters', () => {
    expect(isMessageBodyValid('a'.repeat(8001))).toBe(false)
    expect(isMessageBodyValid('a'.repeat(8000))).toBe(true)
  })
})
