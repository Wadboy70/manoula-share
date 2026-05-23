import { useCallback, useEffect, useRef } from 'react'

import { useSearchParams } from 'react-router-dom'

import {
  parseSearchParam,
  patchSearchParams,
  serializeSearchParam,
  type DefinedSearchParam,
} from '@/lib/search-params'

export type SetSearchParamOptions = {
  /** When true, replaces the current history entry instead of pushing a new one. */
  replace?: boolean
}

export type UseSearchParamResult<T> = {
  /** Parsed value from the current URL, or null if missing/invalid. */
  value: T | null
  /** Write a value to the URL (null removes the param). */
  setValue: (value: T | null, options?: SetSearchParamOptions) => void
  /** Shorthand for `setValue(null)`. */
  clearValue: (options?: SetSearchParamOptions) => void
}

/**
 * Bind a single typed search param to the current route (React Router).
 */
export function useSearchParam<T>(param: DefinedSearchParam<T>): UseSearchParamResult<T> {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = parseSearchParam(param, searchParams.get(param.key))

  const setValue = useCallback(
    (next: T | null, options?: SetSearchParamOptions) => {
      setSearchParams(
        (current) =>
          patchSearchParams(
            current,
            param.key,
            next == null ? null : serializeSearchParam(param, next),
          ),
        { replace: options?.replace ?? false },
      )
    },
    [param, setSearchParams],
  )

  const clearValue = useCallback(
    (options?: SetSearchParamOptions) => {
      setValue(null, options)
    },
    [setValue],
  )

  return { value, setValue, clearValue }
}

export type UseSearchParamEffectOptions<T> = {
  /** When false, URL changes are ignored (e.g. wait until a list has loaded). */
  ready?: boolean
  /** Called when the URL param value changes (not on duplicate renders). */
  onChange: (value: T | null) => void
}

/**
 * React to URL search-param changes without re-firing when the value is unchanged.
 * Uses a microtask so setState in `onChange` satisfies the hooks linter.
 */
export function useSearchParamEffect<T>(
  value: T | null,
  { ready = true, onChange }: UseSearchParamEffectOptions<T>,
): void {
  const lastValueRef = useRef<T | null | undefined>(undefined)

  useEffect(() => {
    if (!ready) return
    if (value === lastValueRef.current) return
    lastValueRef.current = value

    queueMicrotask(() => {
      onChange(value)
    })
  }, [ready, value, onChange])
}
