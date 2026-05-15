export function formatShortRelativeTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function displayName(user: {
  first_name: string | null
  last_name: string | null
}): string {
  const parts = [user.first_name, user.last_name].filter(Boolean) as string[]
  return parts.length > 0 ? parts.join(' ') : 'Member'
}

export function resolveSenderLabel(
  senderId: number,
  client: { id: number; first_name: string | null; last_name: string | null },
  professional: { id: number; first_name: string | null; last_name: string | null },
): string {
  if (senderId === client.id) return displayName(client)
  if (senderId === professional.id) return displayName(professional)
  return 'Member'
}
