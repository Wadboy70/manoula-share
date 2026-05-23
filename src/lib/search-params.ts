/**
 * Shared URL search-param utilities for deep-linking UI state (detail sheets, filters, etc.).
 */

export type SearchParamCodec<T> = {
  parse: (raw: string | null) => T | null
  serialize: (value: T) => string
}

/** Named param + codec — reuse across route builders and hooks. */
export type DefinedSearchParam<T> = {
  key: string
  codec: SearchParamCodec<T>
}

export function defineSearchParam<T>(key: string, codec: SearchParamCodec<T>): DefinedSearchParam<T> {
  return { key, codec }
}

export const searchParamCodecs = {
  string: {
    parse: (raw) => {
      const trimmed = raw?.trim()
      return trimmed ? trimmed : null
    },
    serialize: (value) => value,
  } satisfies SearchParamCodec<string>,

  positiveInt: {
    parse: (raw) => {
      if (!raw) return null
      const id = Number.parseInt(raw, 10)
      if (!Number.isFinite(id) || id <= 0) return null
      return id
    },
    serialize: (value) => String(Math.trunc(value)),
  } satisfies SearchParamCodec<number>,
}

export function parseSearchParam<T>(
  param: DefinedSearchParam<T>,
  raw: string | null,
): T | null {
  return param.codec.parse(raw)
}

export function serializeSearchParam<T>(param: DefinedSearchParam<T>, value: T): string {
  return param.codec.serialize(value)
}

/** Merge search entries into `pathname`; skips null, undefined, and empty string. */
export function buildPathWithSearch(
  pathname: string,
  search: Record<string, string | number | null | undefined>,
): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(search)) {
    if (value == null || value === '') continue
    params.set(key, String(value))
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

/** Set or remove one key on a copy of existing search params. */
export function patchSearchParams(
  current: URLSearchParams,
  key: string,
  value: string | null,
): URLSearchParams {
  const next = new URLSearchParams(current)
  if (value == null) {
    next.delete(key)
  } else {
    next.set(key, value)
  }
  return next
}

export function buildPathWithSearchParam<T>(
  pathname: string,
  param: DefinedSearchParam<T>,
  value: T | null | undefined,
): string {
  return buildPathWithSearch(pathname, {
    [param.key]: value == null ? null : serializeSearchParam(param, value),
  })
}
