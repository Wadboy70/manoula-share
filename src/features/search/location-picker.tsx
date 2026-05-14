import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { LOCATION_SUGGESTION_MIN_QUERY_LENGTH } from '@/features/search/location.constants'
import { fetchLocationSuggestions } from '@/features/search/location.service'
import type { LocationSuggestion } from '@/features/search/location.types'

const LOCATION_DEBOUNCE_MS = 300

type LocationPickerBaseProps = {
  id: string
  label: string
  value: string
  placeholder?: string
  maxLength?: number
  onValueChange: (value: string) => void
  onSuggestionSelected: (suggestion: LocationSuggestion) => void
}

export type LocationPickerProps = LocationPickerBaseProps &
  (
    | { mode?: 'search' }
    | { mode: 'profile'; hasResolvedPlaceId: boolean }
  )

export function LocationPicker(props: LocationPickerProps) {
  const {
    id,
    label,
    value,
    placeholder = `City or region (min. ${LOCATION_SUGGESTION_MIN_QUERY_LENGTH} characters)`,
    maxLength,
    onValueChange,
    onSuggestionSelected,
  } = props
  const mode = props.mode ?? 'search'
  const hasResolvedPlaceId = props.mode === 'profile' ? props.hasResolvedPlaceId : false
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suppressed, setSuppressed] = useState(false)
  const [hasUserEdited, setHasUserEdited] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(value.trim())
    }, LOCATION_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [value])

  useEffect(() => {
    const trimmed = debouncedQuery
    if (!hasUserEdited || trimmed.length < LOCATION_SUGGESTION_MIN_QUERY_LENGTH || suppressed) {
      setSuggestions([])
      setError(null)
      setLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const next = await fetchLocationSuggestions(trimmed, mode)
        if (requestIdRef.current === requestId) {
          setSuggestions(next)
        }
      } catch {
        if (requestIdRef.current === requestId) {
          setSuggestions([])
          setError('Could not load location suggestions.')
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false)
        }
      }
    })()
  }, [debouncedQuery, mode, suppressed, hasUserEdited])

  function handleBlurUncommittedProfile() {
    if (mode !== 'profile') return
    if (hasResolvedPlaceId) return
    if (!value.trim()) return
    onValueChange('')
    setSuggestions([])
    setHasUserEdited(false)
    setSuppressed(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative overflow-visible">
        <Input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => {
            setHasUserEdited(true)
            setSuppressed(false)
            onValueChange(event.target.value)
          }}
          onBlur={handleBlurUncommittedProfile}
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls={`${id}-suggestions`}
        />
        {suggestions.length > 0 ? (
          <ul
            id={`${id}-suggestions`}
            role="listbox"
            className="border-input absolute top-full left-0 right-0 z-[100] mt-1 max-h-60 overflow-auto rounded-lg border bg-[#1a1a1a] py-1 shadow-lg"
          >
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  className="hover:bg-input/50 w-full px-3 py-2 text-left text-sm text-white"
                  onMouseDown={(event) => {
                    event.preventDefault()
                  }}
                  onClick={() => {
                    onValueChange(suggestion.label)
                    onSuggestionSelected(suggestion)
                    setSuggestions([])
                    setSuppressed(true)
                    setHasUserEdited(false)
                    queueMicrotask(() => {
                      document.getElementById(id)?.blur()
                    })
                  }}
                >
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {loading ? <p className="text-muted-foreground text-xs">Searching locations…</p> : null}
      {error ? <p className="text-destructive text-xs leading-relaxed">{error}</p> : null}
    </div>
  )
}
