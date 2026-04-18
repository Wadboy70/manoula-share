import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SearchPage } from '@/pages/search-page'

const useSearchResultsMock = vi.hoisted(() => vi.fn())
const signOutMock = vi.hoisted(() => vi.fn())
const fetchLocationSuggestionsMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/search/use-search-results', () => ({
  useSearchResults: useSearchResultsMock,
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    session: null,
    signOut: signOutMock,
  }),
}))

vi.mock('@/features/search/location.service', () => ({
  fetchLocationSuggestions: fetchLocationSuggestionsMock,
}))

function renderSearchPage() {
  return render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>,
  )
}

describe('SearchPage', () => {
  beforeEach(() => {
    fetchLocationSuggestionsMock.mockReset()
    fetchLocationSuggestionsMock.mockResolvedValue([])
  })

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
    expect(screen.getByRole('link', { name: /view profile for ada nwosu/i })).toHaveAttribute(
      'href',
      '/professionals/1',
    )
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

  it('does not fetch location suggestions until query has at least 3 characters after debounce', async () => {
    useSearchResultsMock.mockReturnValue({
      loading: false,
      error: null,
      retry: vi.fn(),
      results: [],
    })

    renderSearchPage()
    const locationInput = screen.getByRole('textbox', { name: /location/i })

    fireEvent.change(locationInput, { target: { value: 'Lo' } })
    await new Promise((resolve) => setTimeout(resolve, 350))

    expect(fetchLocationSuggestionsMock).not.toHaveBeenCalled()
  })

  it('fetches location suggestions after debounce when query is at least 3 characters', async () => {
    fetchLocationSuggestionsMock.mockResolvedValue([
      { id: '1', label: 'Los Angeles, CA' },
    ])
    useSearchResultsMock.mockReturnValue({
      loading: false,
      error: null,
      retry: vi.fn(),
      results: [],
    })

    renderSearchPage()
    const locationInput = screen.getByRole('textbox', { name: /location/i })

    fireEvent.change(locationInput, { target: { value: 'Los' } })

    await waitFor(
      () => {
        expect(fetchLocationSuggestionsMock).toHaveBeenCalledWith('Los')
      },
      { timeout: 2000 },
    )

    expect(await screen.findByRole('option', { name: /los angeles, ca/i })).toBeInTheDocument()
  })

  it('fills location input when a suggestion is chosen', async () => {
    fetchLocationSuggestionsMock.mockResolvedValue([
      { id: '1', label: 'Los Angeles, CA' },
    ])
    useSearchResultsMock.mockReturnValue({
      loading: false,
      error: null,
      retry: vi.fn(),
      results: [],
    })

    renderSearchPage()
    const locationInput = screen.getByRole('textbox', { name: /location/i })

    fireEvent.change(locationInput, { target: { value: 'Los' } })

    await waitFor(() => {
      expect(fetchLocationSuggestionsMock).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole('option', { name: /los angeles, ca/i }))

    expect(locationInput).toHaveValue('Los Angeles, CA')
  })
})
