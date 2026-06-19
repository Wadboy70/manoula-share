import { supabase } from '@/lib/supabaseClient'

import type {
  AdminIntakeLeadsData,
  AdminIntakeLeadsResult,
  AdminMotherLead,
  AdminProfessionalLead,
} from './admin.types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function parseMotherLead(value: unknown): AdminMotherLead | null {
  if (!isRecord(value) || typeof value.id !== 'number') return null
  return {
    id: value.id,
    first_name: typeof value.first_name === 'string' ? value.first_name : null,
    last_name: typeof value.last_name === 'string' ? value.last_name : null,
    email: typeof value.email === 'string' ? value.email : null,
    lead_status: typeof value.lead_status === 'string' ? value.lead_status : null,
    intake_submitted_at:
      typeof value.intake_submitted_at === 'string' ? value.intake_submitted_at : null,
    location_label: typeof value.location_label === 'string' ? value.location_label : null,
    specialty_labels: parseStringArray(value.specialty_labels),
    looking_for_details:
      typeof value.looking_for_details === 'string' ? value.looking_for_details : null,
  }
}

function parseProfessionalLead(value: unknown): AdminProfessionalLead | null {
  if (!isRecord(value) || typeof value.id !== 'number') return null
  return {
    id: value.id,
    first_name: typeof value.first_name === 'string' ? value.first_name : null,
    last_name: typeof value.last_name === 'string' ? value.last_name : null,
    email: typeof value.email === 'string' ? value.email : null,
    lead_status: typeof value.lead_status === 'string' ? value.lead_status : null,
    intake_submitted_at:
      typeof value.intake_submitted_at === 'string' ? value.intake_submitted_at : null,
    location_label: typeof value.location_label === 'string' ? value.location_label : null,
    specialty_labels: parseStringArray(value.specialty_labels),
    offers_remote: value.offers_remote === true,
    offers_in_home: value.offers_in_home === true,
    offers_provider_location: value.offers_provider_location === true,
    credential_type: typeof value.credential_type === 'string' ? value.credential_type : null,
    issuing_body: typeof value.issuing_body === 'string' ? value.issuing_body : null,
    registration_number:
      typeof value.registration_number === 'string' ? value.registration_number : null,
  }
}

function parseLeadsPayload(data: unknown): AdminIntakeLeadsData | null {
  if (!isRecord(data) || data.ok !== true) return null

  const mothersRaw = data.mothers
  const professionalsRaw = data.professionals

  const mothers = Array.isArray(mothersRaw)
    ? mothersRaw
        .map(parseMotherLead)
        .filter((row): row is AdminMotherLead => row !== null)
    : []

  const professionals = Array.isArray(professionalsRaw)
    ? professionalsRaw
        .map(parseProfessionalLead)
        .filter((row): row is AdminProfessionalLead => row !== null)
    : []

  return { mothers, professionals }
}

export async function fetchAdminIntakeLeads(): Promise<AdminIntakeLeadsResult> {
  const { data, error } = await supabase.rpc('list_admin_intake_leads')

  if (error) {
    return { ok: false, error: error.message }
  }

  if (isRecord(data) && data.ok === false && typeof data.error === 'string') {
    return { ok: false, error: data.error }
  }

  const parsed = parseLeadsPayload(data)
  if (!parsed) {
    return { ok: false, error: 'Unable to load intake leads.' }
  }

  return { ok: true, data: parsed }
}
