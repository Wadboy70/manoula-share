import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DELIVERY_MODES, DELIVERY_MODE_LABELS } from '@/features/search/delivery-mode-filter'
import { SearchPage } from '@/features/search/search-page'

const useSearchResultsMock = vi.hoisted(() => vi.fn())
const signOutMock = vi.hoisted(() => vi.fn())
const fetchLocationSuggestionsMock = vi.hoisted(() => vi.fn())
const fetchSearchSpecialtyOptionsMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/search/use-search-results', () => ({
  useSearchResults: useSearchResultsMock,
}))

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({
    session: null,
    signOut: signOutMock,
  }),
}))

vi.mock('@/features/search/location.service', () => ({
  fetchLocationSuggestions: fetchLocationSuggestionsMock,
}))

vi.mock('@/features/search/specialties.service', () => ({
  fetchSearchSpecialtyOptions: fetchSearchSpecialtyOptionsMock,
}))

function mockLocationSuggestion(overrides: Partial<{ id: string; label: string }> = {}) {
  return {
    id: 'mb-los-angeles',
    label: 'Los Angeles, CA',
    mapboxId: 'mb-los-angeles',
    latitude: 34.05,
    longitude: -118.25,
    ancestorMapboxIds: ['mb-ca', 'mb-us'],
    ...overrides,
  }
}

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
    fetchSearchSpecialtyOptionsMock.mockReset()
    fetchSearchSpecialtyOptionsMock.mockResolvedValue([
      { id: 1, label: 'Lactation Consultant', slug: 'lactation-consultant' },
      { id: 2, label: 'Doula', slug: 'doula' },
    ])
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

  it('renders delivery mode filter with All plus four allowed modes', () => {
    useSearchResultsMock.mockReturnValue({
      loading: false,
      error: null,
      results: [],
      retry: vi.fn(),
    })

    renderSearchPage()

    const select = screen.getByRole('combobox', { name: /delivery mode/i }) as HTMLSelectElement
    expect(select).toBeInTheDocument()
    const values = [...select.options].map((o) => o.value)
    expect(values).toEqual(['', ...DELIVERY_MODES])
    const labels = [...select.options].map((o) => o.textContent?.trim() ?? '')
    expect(labels[0]).toMatch(/all delivery modes/i)
    for (const mode of DELIVERY_MODES) {
      expect(labels).toContain(DELIVERY_MODE_LABELS[mode])
    }
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
          countryCode: 'NG',
          locationLabel: 'In-person and virtual',
          mapboxId: null,
          latitude: null,
          longitude: null,
          offersRemote: true,
          offersInHome: true,
          offersProviderLocation: false,
          specialties: ['Lactation Consultant', 'Nutrition'],
          services: [
            {
              id: 99,
              title: 'Follow-up visit',
              deliveryMode: 'in_home',
              priceCents: 8000,
              currencyCode: 'GBP',
              specialtyLabel: 'Postpartum Doula',
            },
          ],
        },
      ],
    })

    renderSearchPage()
    const article = screen.getByRole('article', { name: /ada nwosu/i })
    expect(within(article).getByRole('heading', { level: 3, name: /^ada nwosu$/i })).toBeInTheDocument()
    expect(within(article).getByText('Lactation Consultant · Nutrition')).toBeInTheDocument()
    expect(within(article).getByText('In-person and virtual')).toBeInTheDocument()
    expect(within(article).getByText('Remote')).toBeInTheDocument()
    expect(within(article).getByText('In-home')).toBeInTheDocument()
    expect(within(article).getByText('Services')).toBeInTheDocument()
    expect(within(article).getByText('Follow-up visit')).toBeInTheDocument()

    const viewLink = within(article).getByRole('link', { name: /^view profile$/i })
    expect(viewLink).toHaveAttribute('href', '/professionals/1')
    const bookLink = within(article).getByRole('link', { name: /^book consultation$/i })
    expect(bookLink).toHaveAttribute('href', '/professionals/1')
  })

  it('shows services matching your search when a delivery mode is selected', async () => {
    const user = userEvent.setup()
    useSearchResultsMock.mockReturnValue({
      loading: false,
      error: null,
      retry: vi.fn(),
      results: [
        {
          professionalId: 1,
          firstName: 'Ada',
          lastName: 'Nwosu',
          profilePhotoUrl: null,
          countryCode: 'NG',
          locationLabel: 'London',
          mapboxId: null,
          latitude: null,
          longitude: null,
          offersRemote: false,
          offersInHome: true,
          offersProviderLocation: false,
          specialties: ['Doula'],
          services: [
            {
              id: 99,
              title: 'Follow-up visit',
              deliveryMode: 'in_home',
              priceCents: null,
              currencyCode: 'GBP',
              specialtyLabel: null,
            },
          ],
        },
      ],
    })

    renderSearchPage()
    const select = screen.getByRole('combobox', { name: /delivery mode/i })
    await user.selectOptions(select, 'in_home')

    expect(screen.getByText('Services matching your search')).toBeInTheDocument()
    const article = screen.getByRole('article', { name: /ada nwosu/i })
    expect(within(article).getByText('Follow-up visit')).toBeInTheDocument()
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
    fetchLocationSuggestionsMock.mockResolvedValue([mockLocationSuggestion()])
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

  it('passes selected location into useSearchResults after choosing a suggestion', async () => {
    fetchLocationSuggestionsMock.mockResolvedValue([mockLocationSuggestion()])
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

    expect(useSearchResultsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        mapboxId: 'mb-los-angeles',
        latitude: 34.05,
        longitude: -118.25,
        ancestorMapboxIds: ['mb-ca', 'mb-us'],
        label: 'Los Angeles, CA',
      }),
      null,
    )
  })

  it('passes selected specialty label into useSearchResults', async () => {
    const user = userEvent.setup()
    useSearchResultsMock.mockReturnValue({
      loading: false,
      error: null,
      retry: vi.fn(),
      results: [],
    })

    renderSearchPage()

    await waitFor(() => {
      expect(fetchSearchSpecialtyOptionsMock).toHaveBeenCalled()
    })

    const specialtySelect = screen.getByRole('combobox', { name: /specialty/i })
    await user.selectOptions(specialtySelect, 'Doula')

    expect(useSearchResultsMock).toHaveBeenLastCalledWith(null, 'Doula')
  })

  it('fills location input when a suggestion is chosen', async () => {
    fetchLocationSuggestionsMock.mockResolvedValue([mockLocationSuggestion()])
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
