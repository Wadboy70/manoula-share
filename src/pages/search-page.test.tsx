import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SearchPage } from '@/pages/search-page'

const useSearchResultsMock = vi.hoisted(() => vi.fn())
const signOutMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/search/use-search-results', () => ({
  useSearchResults: useSearchResultsMock,
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    session: null,
    signOut: signOutMock,
  }),
}))

function renderSearchPage() {
  return render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>,
  )
}

describe('SearchPage', () => {
  it('shows loading state', () => {
    useSearchResultsMock.mockReturnValue({
      loading: true,
      error: null,
      results: [],
      retry: vi.fn(),
    })

    renderSearchPage()
    expect(screen.getByText(/loading search results/i)).toBeInTheDocument()
  })

  it('shows empty state', () => {
    useSearchResultsMock.mockReturnValue({
      loading: false,
      error: null,
      results: [],
      retry: vi.fn(),
    })

    renderSearchPage()
    expect(
      screen.getByText(/no professionals are visible yet/i),
    ).toBeInTheDocument()
  })

  it('shows success state cards', () => {
    useSearchResultsMock.mockReturnValue({
      loading: false,
      error: null,
      retry: vi.fn(),
      results: [
        {
          professionalId: 1,
          firstName: 'Ada',
          lastName: 'Nwosu',
          profilePhotoUrl: 'https://mockmind-api.uifaces.co/content/human/212.jpg',
          serviceArea: 'In-person and virtual',
          locationLocality: 'Lagos',
          locationRegion: 'Lagos',
          countryCode: 'NG',
          specialties: ['Lactation Consultant', 'Nutrition'],
          ratingAvg: 4.9,
          ratingCount: 10,
        },
      ],
    })

    renderSearchPage()
    expect(screen.getByText('Ada Nwosu')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /ada nwosu profile photo/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /rating 5.0 out of 5, 10 reviews/i })).toBeInTheDocument()
    expect(screen.getByText('Lactation Consultant')).toBeInTheDocument()
    expect(screen.getByText('Nutrition')).toBeInTheDocument()
    expect(screen.getByText('In-person and virtual')).toBeInTheDocument()
  })

  it('shows error state and retry action', async () => {
    const retry = vi.fn()
    useSearchResultsMock.mockReturnValue({
      loading: false,
      error: 'Could not load results',
      results: [],
      retry,
    })

    const user = userEvent.setup()
    renderSearchPage()

    expect(screen.getByText(/could not load results/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
