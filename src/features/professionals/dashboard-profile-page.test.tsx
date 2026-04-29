import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardProfilePage } from './dashboard-profile-page'

const useBlockerMock = vi.hoisted(() => vi.fn())
const useAuthMock = vi.hoisted(() => vi.fn())
const fetchProfessionalProfileEditorDataMock = vi.hoisted(() => vi.fn())
const fetchSpecialtyOptionsMock = vi.hoisted(() => vi.fn())
const saveProfessionalProfileEditorDataMock = vi.hoisted(() => vi.fn())
const uploadProfilePhotoMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useBlocker: useBlockerMock }
})

vi.mock('@/features/auth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('./profile.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./profile.service')>()
  return {
    ...actual,
    fetchProfessionalProfileEditorData: fetchProfessionalProfileEditorDataMock,
    fetchSpecialtyOptions: fetchSpecialtyOptionsMock,
    saveProfessionalProfileEditorData: saveProfessionalProfileEditorDataMock,
    uploadProfilePhoto: uploadProfilePhotoMock,
  }
})

describe('DashboardProfilePage', () => {
  beforeEach(() => {
    useBlockerMock.mockReset()
    useAuthMock.mockReset()
    fetchProfessionalProfileEditorDataMock.mockReset()
    fetchSpecialtyOptionsMock.mockReset()
    saveProfessionalProfileEditorDataMock.mockReset()
    uploadProfilePhotoMock.mockReset()

    useAuthMock.mockReturnValue({
      user: null,
      loadAppUser: vi.fn(async () => undefined),
    })
    useBlockerMock.mockImplementation((isDirty: boolean) => ({
      state: isDirty ? 'blocked' : 'unblocked',
      proceed: vi.fn(),
      reset: vi.fn(),
    }))
    fetchProfessionalProfileEditorDataMock.mockResolvedValue({
      ok: true,
      data: {
        professionalId: 1,
        firstName: 'Jane',
        lastName: 'Doe',
        bio: 'Supportive care',
        profilePhotoUrl: '',
        locationLabel: 'London',
        mapboxId: 'place.123',
        latitude: 51.5074,
        longitude: -0.1278,
        geocodedAt: '2026-04-29T00:00:00.000Z',
        countryCode: 'GB',
        isPublicSearchable: true,
        specialtyIds: [],
        credentials: [],
      },
    })
    fetchSpecialtyOptionsMock.mockResolvedValue({ ok: true, data: [] })
    saveProfessionalProfileEditorDataMock.mockResolvedValue({ ok: true, data: undefined })
    uploadProfilePhotoMock.mockResolvedValue({
      ok: true,
      data: 'https://example.com/profile-photo.jpg',
    })
  })

  it('uploads selected photo only when saving', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <DashboardProfilePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit profile/i })).toBeInTheDocument()
    })

    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/profile photo/i), {
      target: { files: [file] },
    })

    expect(uploadProfilePhotoMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => {
      expect(uploadProfilePhotoMock).toHaveBeenCalledTimes(1)
    })
    expect(uploadProfilePhotoMock).toHaveBeenCalledWith(file)
  })

  it('shows unsaved changes warning and cancels navigation when user declines', async () => {
    const reset = vi.fn()
    const proceed = vi.fn()
    useBlockerMock.mockImplementation((isDirty: boolean) => ({
      state: isDirty ? 'blocked' : 'unblocked',
      proceed,
      reset,
    }))
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <DashboardProfilePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit profile/i })).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/first name/i), 'A')

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled()
    })
    expect(reset).toHaveBeenCalled()
    expect(proceed).not.toHaveBeenCalled()
  })
})
