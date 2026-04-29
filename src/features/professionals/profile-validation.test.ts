import { describe, expect, it } from 'vitest'

import { isPhotoFileAllowed, legalNameCharacterMessage, normalizePlainText } from './profile-validation'

describe('profile validation helpers', () => {
  it('strips html tags from plain text values', () => {
    expect(normalizePlainText('<script>alert(1)</script>Hello', 50)).toBe('alert(1)Hello')
  })

  it('rejects unsupported image mime types', () => {
    const file = new File(['binary'], 'avatar.gif', { type: 'image/gif' })
    const result = isPhotoFileAllowed(file)
    expect(result.ok).toBe(false)
  })

  it('rejects image files above 3mb', () => {
    const oversizedBytes = new Uint8Array(3 * 1024 * 1024 + 1)
    const file = new File([oversizedBytes], 'avatar.jpg', { type: 'image/jpeg' })
    const result = isPhotoFileAllowed(file)
    expect(result.ok).toBe(false)
  })

  it('rejects invalid legal-name characters', () => {
    expect(legalNameCharacterMessage('First name', 'J4ne')).toMatch(/can only include/i)
    expect(legalNameCharacterMessage('First name', "O'Connor")).toBeNull()
    expect(legalNameCharacterMessage('First name', 'Zoë')).toBeNull()
  })
})
