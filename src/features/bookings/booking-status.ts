import type { BookingStatus } from './booking.types'

export function bookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'accepted':
      return 'Upcoming'
    case 'completed':
      return 'Completed'
    case 'declined':
      return 'Declined'
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

export function bookingStatusBadgeClass(status: BookingStatus): string {
  switch (status) {
    case 'pending':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-200'
    case 'accepted':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
    case 'completed':
      return 'border-white/20 bg-white/5 text-zinc-300'
    case 'declined':
      return 'border-red-500/30 bg-red-500/10 text-red-200'
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}
