import { type FormEvent, type KeyboardEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type MessageComposerProps = {
  disabled: boolean
  sending: boolean
  onSend: (body: string) => Promise<void>
}

const MAX = 8000

export function MessageComposer({ disabled, sending, onSend }: MessageComposerProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const trimmed = text.trim()
  const canSend = !disabled && !sending && trimmed.length > 0 && trimmed.length <= MAX

  async function sendFromComposer() {
    if (!canSend) return
    setError(null)
    try {
      await onSend(trimmed)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message.')
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await sendFromComposer()
  }

  function onTextareaKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey) return
    if (e.nativeEvent.isComposing) return
    e.preventDefault()
    void sendFromComposer()
  }

  return (
    <form onSubmit={submit} className="border-t border-white/10 bg-[#1a1a1a] p-3">
      {error ? <p className="text-destructive mb-2 text-sm">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
          }}
          onKeyDown={onTextareaKeyDown}
          placeholder="Write a message…"
          disabled={disabled || sending}
          rows={2}
          title="Enter to send · Shift+Enter for a new line"
          className={cn(
            'min-h-[3rem] w-full flex-1 resize-none rounded-lg border border-input bg-input/30 px-2.5 py-2 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          )}
          maxLength={MAX}
          aria-label="Message"
        />
        <Button type="submit" disabled={!canSend} className="shrink-0 sm:min-w-24">
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </form>
  )
}
