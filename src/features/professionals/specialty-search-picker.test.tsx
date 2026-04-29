import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SpecialtySearchPicker } from './specialty-search-picker'

const OPTIONS = [
  { id: 1, label: 'Lactation Consultant' },
  { id: 2, label: 'Doula' },
  { id: 3, label: 'Therapist' },
]

describe('SpecialtySearchPicker', () => {
  it('shows selected specialties as lozenges on load', () => {
    render(
      <SpecialtySearchPicker options={OPTIONS} value={[2, 1]} onChange={vi.fn()} />,
    )

    const list = screen.getByRole('list', { name: /selected specialties/i })
    expect(within(list).getByText('Doula')).toBeInTheDocument()
    expect(within(list).getByText('Lactation Consultant')).toBeInTheDocument()
  })

  it('filters dropdown by search and adds selection as lozenge', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<SpecialtySearchPicker options={OPTIONS} value={[]} onChange={onChange} />)

    await user.type(screen.getByRole('combobox'), 'dou')
    const listbox = screen.getByRole('listbox')
    await user.click(within(listbox).getByRole('option', { name: /^doula$/i }))

    expect(onChange).toHaveBeenCalledWith([2])
  })

  it('removes a specialty when lozenge remove is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<SpecialtySearchPicker options={OPTIONS} value={[2]} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /remove doula/i }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
