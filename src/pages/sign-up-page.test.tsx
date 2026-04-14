import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { SignUpPage } from '@/pages/sign-up-page'

const authSignUpMock = vi.hoisted(() =>
  vi.fn(async (): Promise<{ error: { message: string } | null }> => ({
    error: null,
  })),
)

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: authSignUpMock,
    },
  },
}))

function renderSignUp() {
  const view = render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </MemoryRouter>,
  )
  const card = view.container.querySelector('[data-slot="card"]')
  if (!card) {
    throw new Error('Expected sign-up card root')
  }
  return { ...view, card }
}

describe('SignUpPage', () => {
  beforeEach(() => {
    authSignUpMock.mockReset()
    authSignUpMock.mockResolvedValue({ error: null })
  })

  it('shows validation when first name is empty', async () => {
    const { card } = renderSignUp()
    const form = within(card as HTMLElement).getByRole('textbox', {
      name: /^first name$/i,
    }).closest('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form!)

    expect(
      await screen.findByText(/please enter your first name/i),
    ).toBeInTheDocument()
    expect(authSignUpMock).not.toHaveBeenCalled()
  })

  it('shows success state after sign up', async () => {
    const user = userEvent.setup()
    const { card } = renderSignUp()
    const scope = within(card as HTMLElement)

    await user.type(scope.getByLabelText(/^first name$/i), 'Jane')
    await user.type(scope.getByLabelText(/^email$/i), 'jane@example.com')
    await user.type(scope.getByLabelText(/^password$/i), 'password12')
    await user.click(scope.getByRole('button', { name: /^create account$/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        /check your email to confirm your account/i,
      )
    })
    expect(
      screen.getByRole('link', { name: /back to home/i }),
    ).toBeInTheDocument()
    expect(authSignUpMock).toHaveBeenCalledOnce()
  })

  it('shows server error when sign up fails', async () => {
    authSignUpMock.mockResolvedValue({
      error: { message: 'Email already in use' },
    })
    const user = userEvent.setup()
    const { card } = renderSignUp()
    const scope = within(card as HTMLElement)

    await user.type(scope.getByLabelText(/^first name$/i), 'Jane')
    await user.type(scope.getByLabelText(/^email$/i), 'taken@example.com')
    await user.type(scope.getByLabelText(/^password$/i), 'password12')
    await user.click(scope.getByRole('button', { name: /^create account$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /email already in use/i,
    )
  })
})
