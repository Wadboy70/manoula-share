import { supabase } from '@/lib/supabaseClient'

export type SearchSpecialtyOption = {
  id: number
  label: string
  slug: string
}

export async function fetchSearchSpecialtyOptions(): Promise<SearchSpecialtyOption[]> {
  const { data, error } = await supabase.from('specialties').select('id, label, slug').order('label')

  if (error) {
    throw error
  }

  if (!Array.isArray(data)) {
    return []
  }

  const out: SearchSpecialtyOption[] = []
  for (const row of data) {
    if (typeof row !== 'object' || row === null) continue
    const o = row as Record<string, unknown>
    const id = typeof o.id === 'number' ? o.id : typeof o.id === 'string' ? Number(o.id) : NaN
    const label = typeof o.label === 'string' ? o.label : ''
    const slug = typeof o.slug === 'string' ? o.slug : ''
    if (!Number.isFinite(id) || label.trim() === '' || slug.trim() === '') continue
    out.push({ id, label, slug })
  }
  return out
}
