import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type SpecialtyPickerOption = {
  id: number
  label: string
}

type SpecialtySearchPickerProps = {
  id?: string
  label?: string
  labelClassName?: string
  options: SpecialtyPickerOption[]
  /** Selected specialty ids (order preserved for lozenge display). */
  value: number[]
  onChange: (nextIds: number[]) => void
  disabled?: boolean
}

export function SpecialtySearchPicker({
  id: idProp,
  label = 'Specialties',
  labelClassName,
  options,
  value,
  onChange,
  disabled = false,
}: SpecialtySearchPickerProps) {
  const reactId = useId()
  const listboxId = idProp ?? `${reactId}-specialty-listbox`
  const inputId = `${listboxId}-input`

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const optionById = useMemo(() => new Map(options.map((o) => [o.id, o])), [options])

  const selectedOrdered = useMemo(
    () => value.map((specialtyId) => optionById.get(specialtyId)).filter((o): o is SpecialtyPickerOption => Boolean(o)),
    [value, optionById],
  )

  const normalizedQuery = search.trim().toLowerCase()

  const availableFiltered = useMemo(() => {
    const selectedSet = new Set(value)
    return options.filter((opt) => {
      if (selectedSet.has(opt.id)) return false
      if (normalizedQuery === '') return true
      return opt.label.toLowerCase().includes(normalizedQuery)
    })
  }, [options, value, normalizedQuery])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      const el = rootRef.current
      if (el && !el.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const addSpecialty = useCallback(
    (specialtyId: number) => {
      if (value.includes(specialtyId)) return
      onChange([...value, specialtyId])
      setSearch('')
    },
    [value, onChange],
  )

  const removeSpecialty = useCallback(
    (specialtyId: number) => {
      onChange(value.filter((id) => id !== specialtyId))
    },
    [value, onChange],
  )

  return (
    <div ref={rootRef} className="space-y-2">
      <label className={cn('text-sm font-medium', labelClassName)} htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
          value={search}
          placeholder="Search specialties…"
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            queueMicrotask(() => {
              const root = rootRef.current
              const active = document.activeElement
              if (!root || !active || !root.contains(active)) {
                setOpen(false)
              }
            })
          }}
          className="rounded-lg"
        />
        {open && !disabled ? (
          <ul
            id={listboxId}
            role="listbox"
            className="border-input bg-background absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-lg border py-1 shadow-md"
          >
            {availableFiltered.length === 0 ? (
              <li className="text-muted-foreground px-3 py-2 text-sm" role="presentation">
                {normalizedQuery ? 'No matching specialties.' : 'All specialties are selected.'}
              </li>
            ) : (
              availableFiltered.map((opt) => (
                <li key={opt.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="hover:bg-muted/80 focus:bg-muted/80 w-full px-3 py-2 text-left text-sm outline-none"
                    onMouseDown={(event) => {
                      event.preventDefault()
                    }}
                    onClick={() => addSpecialty(opt.id)}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

      {selectedOrdered.length > 0 ? (
        <ul className="flex flex-wrap gap-2 pt-1" aria-label="Selected specialties">
          {selectedOrdered.map((opt) => (
            <li key={opt.id}>
              <span className="border-foreground/15 bg-foreground/5 text-foreground inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-sm">
                <span className="min-w-0 truncate">{opt.label}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  className="text-muted-foreground hover:text-foreground shrink-0 rounded-full"
                  onClick={() => removeSpecialty(opt.id)}
                  aria-label={`Remove ${opt.label}`}
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
