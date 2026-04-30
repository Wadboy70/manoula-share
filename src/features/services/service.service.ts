import { supabase } from '@/lib/supabaseClient'
import type { TablesInsert, TablesUpdate } from '@/types/database'

import { sanitizeServiceDraft } from './service-validation'
import type { ServiceAreaPlaceInput, ServiceDraft, ServiceProviderLocationInput, SpecialtyOption } from './service.types'

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string }

export type ServicesEditorBootstrap = {
  professionalId: number
  specialties: SpecialtyOption[]
  services: ServiceDraft[]
}

type ServiceRow = {
  id: number
  title: string
  description: string | null
  price_cents: number | null
  currency_code: string
  duration_minutes: number | null
  specialty_id: number | null
  delivery_mode: ServiceDraft['deliveryMode']
  remote_scope: string | null
  provider_location_name: string | null
  service_area_type: ServiceDraft['serviceAreaType']
  service_radius_km: number | null
  service_area_text: string | null
  is_active: boolean
}

async function fetchProfessionalIdForSession(): Promise<ServiceResult<number>> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return { ok: false, error: 'You must be signed in to manage services.' }
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id,is_professional')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (userError || !userRow) {
    return { ok: false, error: userError?.message ?? 'Unable to find your profile.' }
  }
  if (!userRow.is_professional) {
    return { ok: false, error: 'Only professionals can manage services.' }
  }
  return { ok: true, data: userRow.id }
}

function mapProviderLocationRowToInput(
  row: TablesInsert<'service_provider_locations'> & { id: number },
): ServiceProviderLocationInput {
  return {
    id: row.id,
    locationName: row.location_name ?? '',
    locationLabel: row.location_label ?? '',
    mapboxId: row.mapbox_id ?? '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    geocodedAt: row.geocoded_at ?? null,
    countryCode: row.country_code ?? 'GB',
  }
}

function mapAreaPlaceRowToInput(
  row: TablesInsert<'service_area_places'> & { id: number },
): ServiceAreaPlaceInput {
  return {
    id: row.id,
    locationLabel: row.location_label ?? '',
    mapboxId: row.mapbox_id ?? '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    geocodedAt: row.geocoded_at ?? null,
    countryCode: row.country_code ?? 'GB',
  }
}

export function buildEmptyServiceDraft(): ServiceDraft {
  return {
    title: '',
    description: '',
    priceCents: null,
    currencyCode: 'GBP',
    durationMinutes: null,
    specialtyId: null,
    deliveryMode: 'remote',
    remoteScope: 'anywhere',
    serviceAreaType: null,
    serviceRadiusKm: null,
    serviceAreaText: '',
    isActive: true,
    providerLocations: [],
    serviceAreaPlaces: [],
  }
}

export async function fetchServicesEditorData(): Promise<ServiceResult<ServicesEditorBootstrap>> {
  const idResult = await fetchProfessionalIdForSession()
  if (!idResult.ok) return idResult
  const professionalId = idResult.data

  const [{ data: specialtyRows, error: specialtyError }, { data: serviceRows, error: serviceError }] =
    await Promise.all([
      supabase
        .from('professional_specialties')
        .select('specialty_id')
        .eq('professional_id', professionalId),
      supabase
        .from('services')
        .select(
          'id,title,description,price_cents,currency_code,duration_minutes,specialty_id,delivery_mode,remote_scope,provider_location_name,service_area_type,service_radius_km,service_area_text,is_active',
        )
        .eq('professional_id', professionalId)
        .order('updated_at', { ascending: false }),
    ])

  if (specialtyError || serviceError) {
    return {
      ok: false,
      error: specialtyError?.message ?? serviceError?.message ?? 'Failed to load services.',
    }
  }

  const allowedSpecialtyIds = (specialtyRows ?? []).map((row) => row.specialty_id)
  let specialtyOptions: SpecialtyOption[] = []
  if (allowedSpecialtyIds.length > 0) {
    const { data, error } = await supabase
      .from('specialties')
      .select('id,label')
      .in('id', allowedSpecialtyIds)
      .order('label')
    if (error) {
      return { ok: false, error: error.message }
    }
    specialtyOptions = data ?? []
  }

  const serviceIds = (serviceRows ?? []).map((row) => row.id)
  const [{ data: providerRows, error: providerError }, { data: areaRows, error: areaError }] =
    serviceIds.length === 0
      ? [{ data: [], error: null }, { data: [], error: null }]
      : await Promise.all([
          supabase
            .from('service_provider_locations')
            .select(
              'id,service_id,location_name,location_label,mapbox_id,latitude,longitude,geocoded_at,country_code',
            )
            .in('service_id', serviceIds)
            .order('id', { ascending: true }),
          supabase
            .from('service_area_places')
            .select('id,service_id,location_label,mapbox_id,latitude,longitude,geocoded_at,country_code')
            .in('service_id', serviceIds)
            .order('id', { ascending: true }),
        ])

  if (providerError || areaError) {
    return {
      ok: false,
      error: providerError?.message ?? areaError?.message ?? 'Failed to load service locations.',
    }
  }

  const providersByService = new Map<number, ServiceProviderLocationInput[]>()
  for (const row of providerRows ?? []) {
    const current = providersByService.get(row.service_id) ?? []
    current.push(mapProviderLocationRowToInput(row))
    providersByService.set(row.service_id, current)
  }

  const placesByService = new Map<number, ServiceAreaPlaceInput[]>()
  for (const row of areaRows ?? []) {
    const current = placesByService.get(row.service_id) ?? []
    current.push(mapAreaPlaceRowToInput(row))
    placesByService.set(row.service_id, current)
  }

  const services: ServiceDraft[] = (serviceRows as ServiceRow[] | null)?.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    priceCents: row.price_cents,
    currencyCode: row.currency_code,
    durationMinutes: row.duration_minutes,
    specialtyId: row.specialty_id,
    deliveryMode: row.delivery_mode,
    remoteScope:
      row.delivery_mode === 'remote' ? (row.remote_scope === 'country' ? 'country' : 'anywhere') : null,
    serviceAreaType: row.service_area_type,
    serviceRadiusKm: row.service_radius_km,
    serviceAreaText: row.service_area_text ?? '',
    isActive: row.is_active,
    providerLocations: providersByService.get(row.id) ?? [],
    serviceAreaPlaces: placesByService.get(row.id) ?? [],
  })) ?? []

  return {
    ok: true,
    data: {
      professionalId,
      specialties: specialtyOptions,
      services,
    },
  }
}

async function replaceProviderLocations(serviceId: number, rows: ServiceProviderLocationInput[]): Promise<ServiceResult<void>> {
  const { error: deleteError } = await supabase.from('service_provider_locations').delete().eq('service_id', serviceId)
  if (deleteError) return { ok: false, error: deleteError.message }
  if (rows.length === 0) return { ok: true, data: undefined }

  const payload: TablesInsert<'service_provider_locations'>[] = rows.map((row) => ({
    service_id: serviceId,
    location_name: row.locationName || null,
    location_label: row.locationLabel || null,
    mapbox_id: row.mapboxId || null,
    latitude: row.latitude,
    longitude: row.longitude,
    geocoded_at: row.geocodedAt,
    country_code: row.countryCode || 'GB',
  }))
  const { error } = await supabase.from('service_provider_locations').insert(payload)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: undefined }
}

async function replaceAreaPlaces(serviceId: number, rows: ServiceAreaPlaceInput[]): Promise<ServiceResult<void>> {
  const { error: deleteError } = await supabase.from('service_area_places').delete().eq('service_id', serviceId)
  if (deleteError) return { ok: false, error: deleteError.message }
  if (rows.length === 0) return { ok: true, data: undefined }
  const payload: TablesInsert<'service_area_places'>[] = rows.map((row) => ({
    service_id: serviceId,
    location_label: row.locationLabel || null,
    mapbox_id: row.mapboxId || null,
    latitude: row.latitude,
    longitude: row.longitude,
    geocoded_at: row.geocodedAt,
    country_code: row.countryCode || 'GB',
  }))
  const { error } = await supabase.from('service_area_places').insert(payload)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: undefined }
}

export async function saveServiceDraft(
  professionalId: number,
  rawDraft: ServiceDraft,
): Promise<ServiceResult<ServiceDraft>> {
  const draft = sanitizeServiceDraft(rawDraft)
  const normalizedServiceAreaType =
    draft.deliveryMode === 'in_home' &&
    (draft.serviceAreaType === 'radius' || draft.serviceAreaType === 'place_list')
      ? draft.serviceAreaType
      : null
  const basePayload: TablesUpdate<'services'> = {
    title: draft.title,
    description: draft.description || null,
    price_cents: draft.priceCents,
    currency_code: 'GBP',
    duration_minutes: draft.durationMinutes,
    specialty_id: draft.specialtyId,
    delivery_mode: draft.deliveryMode,
    remote_scope: draft.deliveryMode === 'remote' ? draft.remoteScope : null,
    provider_location_name: null,
    service_area_type: normalizedServiceAreaType,
    service_radius_km:
      draft.deliveryMode === 'in_home' && normalizedServiceAreaType === 'radius'
        ? draft.serviceRadiusKm
        : null,
    service_area_text: draft.deliveryMode === 'in_home' ? draft.serviceAreaText || null : null,
    is_active: draft.isActive,
  }

  let serviceId = draft.id
  if (serviceId) {
    const { error } = await supabase
      .from('services')
      .update(basePayload)
      .eq('id', serviceId)
      .eq('professional_id', professionalId)
    if (error) return { ok: false, error: error.message }
  } else {
    const insertPayload: TablesInsert<'services'> = {
      professional_id: professionalId,
      title: draft.title,
      delivery_mode: draft.deliveryMode,
      description: basePayload.description ?? null,
      price_cents: draft.priceCents,
      currency_code: 'GBP',
      duration_minutes: draft.durationMinutes,
      specialty_id: draft.specialtyId,
      remote_scope: basePayload.remote_scope ?? null,
      provider_location_name: null,
      service_area_type: normalizedServiceAreaType,
      service_radius_km: basePayload.service_radius_km ?? null,
      service_area_text: basePayload.service_area_text ?? null,
      is_active: draft.isActive,
    }
    const { data, error } = await supabase.from('services').insert(insertPayload).select('id').single()
    if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create service.' }
    serviceId = data.id
  }

  const providerSync = await replaceProviderLocations(
    serviceId,
    draft.deliveryMode === 'provider_location' ? draft.providerLocations : [],
  )
  if (!providerSync.ok) return providerSync

  const placeSync = await replaceAreaPlaces(
    serviceId,
    draft.deliveryMode === 'in_home' && normalizedServiceAreaType === 'place_list'
      ? draft.serviceAreaPlaces
      : [],
  )
  if (!placeSync.ok) return placeSync

  const refresh = await fetchServicesEditorData()
  if (!refresh.ok) return { ok: false, error: refresh.error }
  const saved = refresh.data.services.find((service) => service.id === serviceId)
  if (!saved) return { ok: false, error: 'Saved service could not be loaded.' }
  return { ok: true, data: saved }
}

export async function deleteService(professionalId: number, serviceId: number): Promise<ServiceResult<void>> {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)
    .eq('professional_id', professionalId)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: undefined }
}
