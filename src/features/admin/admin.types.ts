export type AdminMotherLead = {
  id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  lead_status: string | null
  intake_submitted_at: string | null
  location_label: string | null
  specialty_labels: string[]
  looking_for_details: string | null
}

export type AdminProfessionalLead = {
  id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  lead_status: string | null
  intake_submitted_at: string | null
  location_label: string | null
  specialty_labels: string[]
  offers_remote: boolean
  offers_in_home: boolean
  offers_provider_location: boolean
  credential_type: string | null
  issuing_body: string | null
  registration_number: string | null
}

export type AdminIntakeLeadsData = {
  mothers: AdminMotherLead[]
  professionals: AdminProfessionalLead[]
}

export type AdminIntakeLeadsResult =
  | { ok: true; data: AdminIntakeLeadsData }
  | { ok: false; error: string }
