import { describe, expect, it, vi } from 'vitest'

import { applyDeliveryModeChangeWithConfirmation } from './dashboard-services-page'
import { buildEmptyServiceDraft } from './service.service'

describe('applyDeliveryModeChangeWithConfirmation', () => {
  it('blocks mode switch when user cancels confirmation', () => {
    const draft = {
      ...buildEmptyServiceDraft(),
      deliveryMode: 'provider_location' as const,
      providerLocations: [
        {
          locationName: 'Clinic A',
          locationLabel: 'London',
          placeId: 'mbx',
          latitude: 1,
          longitude: 2,
          geocodedAt: new Date().toISOString(),
          countryCode: 'GB',
        },
      ],
    }
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const decision = applyDeliveryModeChangeWithConfirmation(draft, 'remote')
    expect(decision.apply).toBe(false)
    confirmSpy.mockRestore()
  })

  it('clears incompatible location data on confirm', () => {
    const draft = {
      ...buildEmptyServiceDraft(),
      deliveryMode: 'provider_location' as const,
      providerLocations: [
        {
          locationName: 'Clinic A',
          locationLabel: 'London',
          placeId: 'mbx',
          latitude: 1,
          longitude: 2,
          geocodedAt: new Date().toISOString(),
          countryCode: 'GB',
        },
      ],
    }
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const decision = applyDeliveryModeChangeWithConfirmation(draft, 'remote')
    expect(decision.apply).toBe(true)
    expect(decision.draft.providerLocations).toEqual([])
    expect(decision.draft.deliveryMode).toBe('remote')
    confirmSpy.mockRestore()
  })
})
