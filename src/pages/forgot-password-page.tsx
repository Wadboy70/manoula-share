import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabaseClient'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }

    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    )
    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSuccessMessage('Check your email for a password reset link.')
  }

  return (
    <div className="font-body flex min-h-svh items-center justify-center bg-[#1a1a1a] px-4 py-12">
      <Card className="w-full max-w-md border-white/10 shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Forgot password</CardTitle>
          <CardDescription>
            We will send a secure reset link to your email.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="text-sm leading-none font-medium">
                Email
              </label>
              <Input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
            {successMessage ? (
              <p className="text-muted-foreground text-sm" role="status" aria-live="polite">
                {successMessage}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 bg-transparent">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Sending link...' : 'Send reset link'}
            </Button>
            <p className="text-muted-foreground text-sm">
              <Link
                to="/signin"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
