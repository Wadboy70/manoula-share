import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LocationPicker } from './location-picker'

const fetchLocationSuggestionsMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/search/location.service', () => ({
  fetchLocationSuggestions: fetchLocationSuggestionsMock,
}))

describe('LocationPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    fetchLocationSuggestionsMock.mockReset()
    fetchLocationSuggestionsMock.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not fetch on initial load with prefilled value', async () => {
    render(
      <LocationPicker
        id="profile-location"
        label="Location"
        mode="profile"
        hasResolvedPlaceId
        value="London, UK"
        onValueChange={vi.fn()}
        onSuggestionSelected={vi.fn()}
      />,
    )

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    expect(fetchLocationSuggestionsMock).not.toHaveBeenCalled()
  })

  it('fetches only after user edits input', async () => {
    function ControlledPicker() {
      const [value, setValue] = useState('')
      return (
        <LocationPicker
          id="profile-location"
          label="Location"
          mode="profile"
          hasResolvedPlaceId={false}
          value={value}
          onValueChange={setValue}
          onSuggestionSelected={vi.fn()}
        />
      )
    }

    render(<ControlledPicker />)

    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: 'Lond' },
    })

    await act(async () => {
      vi.advanceTimersByTime(350)
      await Promise.resolve()
    })

    expect(fetchLocationSuggestionsMock).toHaveBeenCalledWith('Lond', 'profile')
  })

  it('clears profile mode text on blur when there is no resolved place id', () => {
    const onValueChange = vi.fn()
    render(
      <LocationPicker
        id="profile-location"
        label="Location"
        mode="profile"
        hasResolvedPlaceId={false}
        value="Typed only"
        onValueChange={onValueChange}
        onSuggestionSelected={vi.fn()}
      />,
    )

    fireEvent.blur(screen.getByLabelText(/location/i))

    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('does not clear profile mode on blur when a place id is resolved', () => {
    const onValueChange = vi.fn()
    render(
      <LocationPicker
        id="profile-location"
        label="Location"
        mode="profile"
        hasResolvedPlaceId
        value="London, UK"
        onValueChange={onValueChange}
        onSuggestionSelected={vi.fn()}
      />,
    )

    fireEvent.blur(screen.getByLabelText(/location/i))

    expect(onValueChange).not.toHaveBeenCalled()
  })
})
