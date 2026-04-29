import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ProfileIncompletePrompt } from './profile-incomplete-prompt'

describe('ProfileIncompletePrompt', () => {
  it('renders CTA when profile is incomplete', () => {
    render(
      <MemoryRouter>
        <ProfileIncompletePrompt
          percentage={57}
          isComplete={false}
          missingItems={['Add your full name']}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText(/complete your profile/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /finish profile/i })).toHaveAttribute(
      'href',
      '/dashboard/profile',
    )
  })

  it('does not render when complete', () => {
    render(
      <MemoryRouter>
        <ProfileIncompletePrompt percentage={100} isComplete missingItems={[]} />
      </MemoryRouter>,
    )
    expect(screen.queryByText(/complete your profile/i)).not.toBeInTheDocument()
  })

  it('hides CTA when hideCta is true', () => {
    render(
      <MemoryRouter>
        <ProfileIncompletePrompt
          percentage={80}
          isComplete={false}
          missingItems={['Add your full name']}
          hideCta
        />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('link', { name: /finish profile/i })).not.toBeInTheDocument()
  })
})
