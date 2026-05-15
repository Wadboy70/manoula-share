const MAX = 8000

export function isMessageBodyValid(body: string): boolean {
  const t = body.trim()
  return t.length > 0 && t.length <= MAX
}
