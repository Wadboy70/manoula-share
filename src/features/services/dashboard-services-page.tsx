import { type ChangeEvent, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DELIVERY_MODE_LABELS, type DeliveryMode } from '@/features/search/delivery-mode-filter'
import { SpecialtySearchPicker } from '@/features/professionals/specialty-search-picker'
import { LocationPicker } from '@/features/search/location-picker'
import type { LocationSuggestion } from '@/features/search/location.types'

import { buildEmptyServiceDraft, deleteService, fetchServicesEditorData, saveServiceDraft } from './service.service'
import {
  formatCentsToGbpPriceInput,
  isValidGbpPriceInput,
  lengthOverLimitMessage,
  parseGbpPriceInputToCents,
  SERVICE_LIMITS,
} from './service-validation'
import type { ServiceAreaPlaceInput, ServiceDraft, ServiceProviderLocationInput, SpecialtyOption } from './service.types'

type PageState = {
  loading: boolean
  saving: boolean
  deleting: boolean
  error: string | null
  success: string | null
}

type DeliveryModeChangeDecision = {
  apply: boolean
  draft: ServiceDraft
}

function createProviderLocationDraft(): ServiceProviderLocationInput {
  return {
    locationName: '',
    locationLabel: '',
    placeId: '',
    latitude: null,
    longitude: null,
    geocodedAt: null,
    countryCode: 'GB',
  }
}

function createAreaPlaceDraft(): ServiceAreaPlaceInput {
  return {
    locationLabel: '',
    placeId: '',
    latitude: null,
    longitude: null,
    geocodedAt: null,
    countryCode: 'GB',
  }
}

function clearModeSpecificFieldsForDraft(draft: ServiceDraft, mode: DeliveryMode): ServiceDraft {
  if (mode === 'remote') {
    return {
      ...draft,
      serviceAreaType: null,
      serviceRadiusKm: null,
      serviceAreaText: '',
      providerLocations: [],
      serviceAreaPlaces: [],
      remoteScope: draft.remoteScope ?? 'anywhere',
    }
  }
  if (mode === 'provider_location') {
    return {
      ...draft,
      remoteScope: null,
      serviceAreaType: null,
      serviceRadiusKm: null,
      serviceAreaText: '',
      serviceAreaPlaces: [],
    }
  }
  return {
    ...draft,
    remoteScope: null,
    providerLocations: [],
    serviceAreaType: draft.serviceAreaType ?? 'place_list',
  }
}

export function applyDeliveryModeChangeWithConfirmation(
  draft: ServiceDraft,
  nextMode: DeliveryMode,
): DeliveryModeChangeDecision {
  const hadProviderData = draft.providerLocations.length > 0
  const hadInHomeData =
    draft.serviceAreaPlaces.length > 0 ||
    draft.serviceAreaText.trim().length > 0 ||
    draft.serviceRadiusKm !== null
  const hadRemoteData = draft.remoteScope === 'country'

  const hasIncompatibleData =
    (nextMode !== 'provider_location' && hadProviderData) ||
    (nextMode !== 'in_home' && hadInHomeData) ||
    (nextMode !== 'remote' && hadRemoteData)

  if (hasIncompatibleData) {
    const confirmed = window.confirm(
      'Switching delivery mode will clear incompatible location details. Continue?',
    )
    if (!confirmed) return { apply: false, draft }
  }

  return {
    apply: true,
    draft: {
      ...clearModeSpecificFieldsForDraft(draft, nextMode),
      deliveryMode: nextMode,
    },
  }
}

function modeBadgeLabel(mode: DeliveryMode): string {
  return DELIVERY_MODE_LABELS[mode]
}

export function DashboardServicesPage() {
  const selectClassName = 'border-input bg-background h-10 w-full rounded-lg border px-3 pr-10 text-sm'
  const [professionalId, setProfessionalId] = useState<number | null>(null)
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([])
  const [services, setServices] = useState<ServiceDraft[]>([])
  const [selectedId, setSelectedId] = useState<number | 'new' | null>(null)
  const [editorVisible, setEditorVisible] = useState(false)
  const [draft, setDraft] = useState<ServiceDraft>(buildEmptyServiceDraft)
  const [priceInput, setPriceInput] = useState('')
  const [state, setState] = useState<PageState>({
    loading: true,
    saving: false,
    deleting: false,
    error: null,
    success: null,
  })

  useEffect(() => {
    async function bootstrap() {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const result = await fetchServicesEditorData()
      if (!result.ok) {
        setState((prev) => ({ ...prev, loading: false, error: result.error }))
        return
      }
      setProfessionalId(result.data.professionalId)
      setSpecialties(result.data.specialties)
      setServices(result.data.services)
      setSelectedId(null)
      setEditorVisible(false)
      setDraft(buildEmptyServiceDraft())
      setPriceInput('')
      setState((prev) => ({ ...prev, loading: false }))
    }
    void bootstrap()
  }, [])

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedId),
    [services, selectedId],
  )

  const lengthErrors = useMemo(() => {
    return {
      title:
        draft.title.length > SERVICE_LIMITS.titleMax
          ? lengthOverLimitMessage('Title', draft.title.length, SERVICE_LIMITS.titleMax)
          : null,
      description:
        draft.description.length > SERVICE_LIMITS.descriptionMax
          ? lengthOverLimitMessage('Description', draft.description.length, SERVICE_LIMITS.descriptionMax)
          : null,
      serviceAreaText:
        draft.serviceAreaText.length > SERVICE_LIMITS.serviceAreaTextMax
          ? lengthOverLimitMessage(
              'Service area details',
              draft.serviceAreaText.length,
              SERVICE_LIMITS.serviceAreaTextMax,
            )
          : null,
    }
  }, [draft])

  const priceFormatError = useMemo(() => {
    if (isValidGbpPriceInput(priceInput)) return null
    return 'Price must be a valid GBP amount (for example: 75 or 75.50).'
  }, [priceInput])

  const hasLengthErrors = Boolean(
    lengthErrors.title ||
      lengthErrors.description ||
      lengthErrors.serviceAreaText ||
      priceFormatError,
  )

  function selectService(next: ServiceDraft | null) {
    if (next?.id) {
      setSelectedId(next.id)
      setDraft(next)
      setPriceInput(formatCentsToGbpPriceInput(next.priceCents))
      setEditorVisible(true)
      return
    }
    setSelectedId('new')
    setDraft(buildEmptyServiceDraft())
    setPriceInput('')
    setEditorVisible(true)
  }

  function onDeliveryModeChanged(event: ChangeEvent<HTMLSelectElement>) {
    const nextMode = event.target.value as DeliveryMode
    const decision = applyDeliveryModeChangeWithConfirmation(draft, nextMode)
    if (decision.apply) setDraft(decision.draft)
  }

  async function onSave() {
    if (!professionalId || hasLengthErrors || draft.title.trim().length === 0) return
    const nextPriceCents = parseGbpPriceInputToCents(priceInput)
    if (priceInput.trim().length > 0 && nextPriceCents === null) return
    setState((prev) => ({ ...prev, saving: true, error: null, success: null }))
    const result = await saveServiceDraft(professionalId, {
      ...draft,
      priceCents: nextPriceCents,
      currencyCode: 'GBP',
      serviceAreaType:
        draft.deliveryMode === 'in_home' &&
        (draft.serviceAreaType === 'radius' || draft.serviceAreaType === 'place_list')
          ? draft.serviceAreaType
          : null,
    })
    if (!result.ok) {
      setState((prev) => ({ ...prev, saving: false, error: result.error }))
      return
    }
    const refresh = await fetchServicesEditorData()
    if (!refresh.ok) {
      setState((prev) => ({ ...prev, saving: false, error: refresh.error }))
      return
    }
    setServices(refresh.data.services)
    setSelectedId(null)
    setDraft(buildEmptyServiceDraft())
    setPriceInput('')
    setEditorVisible(false)
    setState((prev) => ({ ...prev, saving: false, success: 'Service saved.' }))
  }

  async function onDelete() {
    if (!professionalId || !draft.id) return
    const confirmed = window.confirm('Delete this service? This cannot be undone.')
    if (!confirmed) return
    setState((prev) => ({ ...prev, deleting: true, error: null, success: null }))
    const result = await deleteService(professionalId, draft.id)
    if (!result.ok) {
      setState((prev) => ({ ...prev, deleting: false, error: result.error }))
      return
    }
    const refresh = await fetchServicesEditorData()
    if (!refresh.ok) {
      setState((prev) => ({ ...prev, deleting: false, error: refresh.error }))
      return
    }
    setServices(refresh.data.services)
    setSelectedId(null)
    setDraft(buildEmptyServiceDraft())
    setPriceInput('')
    setEditorVisible(false)
    setState((prev) => ({ ...prev, deleting: false, success: 'Service deleted.' }))
  }

  if (state.loading) {
    return <p className="text-muted-foreground text-sm">Loading services...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl text-white md:text-3xl">Services</h1>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Create and manage your services, including delivery mode and location details.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All services</CardTitle>
            <CardDescription>Browse existing services or create a new one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button type="button" className="w-full rounded-lg" onClick={() => selectService(null)}>
              Create service
            </Button>
            {services.length === 0 ? <p className="text-muted-foreground text-sm">No services yet.</p> : null}
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                className="border-foreground/10 hover:bg-muted/30 w-full border px-3 py-2 text-left"
                onClick={() => selectService(service)}
              >
                <p className="text-sm font-medium">{service.title || 'Untitled service'}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {modeBadgeLabel(service.deliveryMode)} · {service.isActive ? 'Active' : 'Inactive'}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {editorVisible ? (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{selectedId === 'new' ? 'Create service' : 'Edit service'}</CardTitle>
              <CardDescription>
                Enter full details and set location data based on delivery mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="service-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="service-title"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                maxLength={SERVICE_LIMITS.titleMax}
                className="rounded-lg"
              />
              <p className="text-muted-foreground text-xs tabular-nums">
                {draft.title.length} / {SERVICE_LIMITS.titleMax}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="service-description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="service-description"
                rows={4}
                value={draft.description}
                maxLength={SERVICE_LIMITS.descriptionMax}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
              <p className="text-muted-foreground text-xs tabular-nums">
                {draft.description.length} / {SERVICE_LIMITS.descriptionMax}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="service-price" className="text-sm font-medium">
                  Price (GBP)
                </label>
                <Input
                  id="service-price"
                  inputMode="decimal"
                  value={priceInput}
                  placeholder="75 or 75.50"
                  onChange={(event) => setPriceInput(event.target.value)}
                  className="rounded-lg"
                />
                <p className="text-muted-foreground text-xs">Use GBP only for now.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="service-duration" className="text-sm font-medium">
                  Duration (minutes)
                </label>
                <Input
                  id="service-duration"
                  type="number"
                  min={0}
                  value={draft.durationMinutes ?? ''}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      durationMinutes: event.target.value === '' ? null : Number(event.target.value),
                    }))
                  }
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Specialty</label>
              {specialties.length > 0 ? (
                <SpecialtySearchPicker
                  id="service-specialty"
                  options={specialties}
                  value={draft.specialtyId ? [draft.specialtyId] : []}
                  onChange={(nextIds) =>
                    setDraft((prev) => ({
                      ...prev,
                      specialtyId: nextIds.length > 0 ? (nextIds[nextIds.length - 1] ?? null) : null,
                    }))
                  }
                />
              ) : (
                <p className="text-muted-foreground text-sm">
                  No specialties available yet. Add specialties to your profile first.
                </p>
              )}
            </div>

            <div className="space-y-2 border border-white/10 rounded-lg p-3">
              <label htmlFor="service-mode" className="text-sm font-medium">
                Delivery mode
              </label>
              <select
                id="service-mode"
                className={selectClassName}
                value={draft.deliveryMode}
                onChange={onDeliveryModeChanged}
              >
                <option value="remote">Remote</option>
                <option value="provider_location">Provider location</option>
                <option value="in_home">In-home</option>
              </select>
              <p className="text-muted-foreground text-xs">
                Delivery mode determines which location fields are required below.
              </p>
            </div>

            {draft.deliveryMode === 'remote' ? (
              <div className="space-y-3 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-semibold">Mode-specific details: Remote</h3>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.remoteScope === 'country'}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        remoteScope: event.target.checked ? 'country' : 'anywhere',
                      }))
                    }
                  />
                  Country bounded remote service
                </label>
              </div>
            ) : null}

            {draft.deliveryMode === 'provider_location' ? (
              <div className="space-y-4 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-semibold">Mode-specific details: Provider location</h3>
                {draft.providerLocations.map((location, index) => (
                  <div key={location.id ?? `provider-${index}`} className="border-foreground/10 space-y-3 border p-3">
                    <Input
                      placeholder="Location name"
                      maxLength={SERVICE_LIMITS.locationNameMax}
                      value={location.locationName}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          providerLocations: prev.providerLocations.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, locationName: event.target.value } : row,
                          ),
                        }))
                      }
                      className="rounded-lg"
                    />
                    <LocationPicker
                      id={`provider-location-picker-${index}`}
                      label="Location"
                      mode="profile"
                      hasResolvedPlaceId={location.placeId.trim().length > 0}
                      maxLength={SERVICE_LIMITS.locationLabelMax}
                      value={location.locationLabel}
                      onValueChange={(next) =>
                        setDraft((prev) => ({
                          ...prev,
                          providerLocations: prev.providerLocations.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  locationLabel: next,
                                  placeId: '',
                                  latitude: null,
                                  longitude: null,
                                  geocodedAt: null,
                                }
                              : row,
                          ),
                        }))
                      }
                      onSuggestionSelected={(suggestion: LocationSuggestion) =>
                        setDraft((prev) => ({
                          ...prev,
                          providerLocations: prev.providerLocations.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  locationLabel: suggestion.label,
                                  placeId: suggestion.placeId,
                                  latitude: suggestion.latitude,
                                  longitude: suggestion.longitude,
                                  countryCode: suggestion.countryCode,
                                  geocodedAt: new Date().toISOString(),
                                }
                              : row,
                          ),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          providerLocations: prev.providerLocations.filter((_, rowIndex) => rowIndex !== index),
                        }))
                      }
                    >
                      Remove location
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      providerLocations: [...prev.providerLocations, createProviderLocationDraft()],
                    }))
                  }
                >
                  Add provider location
                </Button>
              </div>
            ) : null}

            {draft.deliveryMode === 'in_home' ? (
              <div className="space-y-4 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-semibold">Mode-specific details: In-home</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="in-home-area-type" className="text-sm font-medium">
                      Service area type
                    </label>
                    <select
                      id="in-home-area-type"
                      className={selectClassName}
                      value={draft.serviceAreaType ?? ''}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          serviceAreaType: event.target.value
                            ? (event.target.value as ServiceDraft['serviceAreaType'])
                            : null,
                          serviceRadiusKm: event.target.value === 'radius' ? prev.serviceRadiusKm : null,
                          serviceAreaPlaces:
                            event.target.value === 'place_list' ? prev.serviceAreaPlaces : [],
                        }))
                      }
                    >
                      <option value="">Select type</option>
                      <option value="place_list">Place list</option>
                      <option value="radius">Radius</option>
                    </select>
                  </div>
                  {draft.serviceAreaType === 'radius' ? (
                    <div className="space-y-2">
                      <label htmlFor="in-home-radius" className="text-sm font-medium">
                        Radius (km)
                      </label>
                      <Input
                        id="in-home-radius"
                        type="number"
                        min={0}
                        value={draft.serviceRadiusKm ?? ''}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            serviceRadiusKm: event.target.value === '' ? null : Number(event.target.value),
                          }))
                        }
                        className="rounded-lg"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label htmlFor="in-home-text" className="text-sm font-medium">
                    Service area details
                  </label>
                  <Input
                    id="in-home-text"
                    value={draft.serviceAreaText}
                    maxLength={SERVICE_LIMITS.serviceAreaTextMax}
                    onChange={(event) => setDraft((prev) => ({ ...prev, serviceAreaText: event.target.value }))}
                    className="rounded-lg"
                  />
                </div>
                {draft.serviceAreaType === 'place_list'
                  ? draft.serviceAreaPlaces.map((place, index) => (
                  <div key={place.id ?? `place-${index}`} className="border-foreground/10 space-y-3 border p-3">
                    <LocationPicker
                      id={`in-home-place-picker-${index}`}
                      label="Service area place"
                      mode="profile"
                      hasResolvedPlaceId={place.placeId.trim().length > 0}
                      maxLength={SERVICE_LIMITS.locationLabelMax}
                      value={place.locationLabel}
                      onValueChange={(next) =>
                        setDraft((prev) => ({
                          ...prev,
                          serviceAreaPlaces: prev.serviceAreaPlaces.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  locationLabel: next,
                                  placeId: '',
                                  latitude: null,
                                  longitude: null,
                                  geocodedAt: null,
                                }
                              : row,
                          ),
                        }))
                      }
                      onSuggestionSelected={(suggestion: LocationSuggestion) =>
                        setDraft((prev) => ({
                          ...prev,
                          serviceAreaPlaces: prev.serviceAreaPlaces.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  locationLabel: suggestion.label,
                                  placeId: suggestion.placeId,
                                  latitude: suggestion.latitude,
                                  longitude: suggestion.longitude,
                                  countryCode: suggestion.countryCode,
                                  geocodedAt: new Date().toISOString(),
                                }
                              : row,
                          ),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          serviceAreaPlaces: prev.serviceAreaPlaces.filter((_, rowIndex) => rowIndex !== index),
                        }))
                      }
                    >
                      Remove place
                    </Button>
                  </div>
                ))
                  : null}
                {draft.serviceAreaType === 'place_list' ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        serviceAreaPlaces: [...prev.serviceAreaPlaces, createAreaPlaceDraft()],
                      }))
                    }
                  >
                    Add service area place
                  </Button>
                ) : null}
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              Active service
            </label>

            {Object.values(lengthErrors)
              .filter(Boolean)
              .map((message) => (
                <p key={message} role="alert" className="text-destructive text-sm">
                  {message}
                </p>
              ))}
            {priceFormatError ? (
              <p role="alert" className="text-destructive text-sm">
                {priceFormatError}
              </p>
            ) : null}
            {state.error ? (
              <p role="alert" className="text-destructive text-sm">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p role="status" className="text-emerald-400 text-sm">
                {state.success}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" className="rounded-lg" disabled={state.saving || hasLengthErrors} onClick={onSave}>
                {state.saving ? 'Saving...' : selectedService ? 'Save changes' : 'Create service'}
              </Button>
              {selectedService?.id ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  disabled={state.deleting}
                  onClick={onDelete}
                >
                  {state.deleting ? 'Deleting...' : 'Delete'}
                </Button>
              ) : null}
            </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Service editor</CardTitle>
              <CardDescription>
                Choose a service from the list or click &quot;Create service&quot; to open the editor.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}
