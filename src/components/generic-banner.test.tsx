import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { GenericBanner } from './generic-banner'

describe('GenericBanner', () => {
  it('renders generic banner content and action', () => {
    render(
      <GenericBanner
        title="Action needed"
        description="Please review your settings."
        items={['Missing profile photo']}
        action={<button type="button">Review now</button>}
        tone="warning"
      />,
    )

    expect(screen.getByText(/action needed/i)).toBeInTheDocument()
    expect(screen.getByText(/please review your settings/i)).toBeInTheDocument()
    expect(screen.getByText(/missing profile photo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /review now/i })).toBeInTheDocument()
  })
})
