import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { fetchSearchSpecialtyOptions } from '@/features/search/specialties.service'

describe('fetchSearchSpecialtyOptions', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('returns normalized rows ordered by the query', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 2, label: 'B', slug: 'b' },
            { id: 1, label: 'A', slug: 'a' },
          ],
          error: null,
        }),
      }),
    })

    const rows = await fetchSearchSpecialtyOptions()
    expect(rows).toEqual([
      { id: 2, label: 'B', slug: 'b' },
      { id: 1, label: 'A', slug: 'a' },
    ])
    expect(fromMock).toHaveBeenCalledWith('specialties')
  })

  it('throws when Supabase returns an error', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('rls'),
        }),
      }),
    })

    await expect(fetchSearchSpecialtyOptions()).rejects.toThrow('rls')
  })
})
