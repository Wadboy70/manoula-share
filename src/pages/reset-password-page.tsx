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

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!password.trim()) {
      setError('Please enter a new password.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccessMessage('Password updated successfully. You can now sign in.')
  }

  return (
    <div className="font-body flex min-h-svh items-center justify-center bg-[#1a1a1a] px-4 py-12">
      <Card className="w-full max-w-md border-white/10 shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Reset password</CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="reset-password" className="text-sm leading-none font-medium">
                New password
              </label>
              <Input
                id="reset-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="reset-confirm-password"
                className="text-sm leading-none font-medium"
              >
                Confirm password
              </label>
              <Input
                id="reset-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
              {loading ? 'Updating...' : 'Update password'}
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
