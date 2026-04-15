import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

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
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'

type FieldErrors = {
  email?: string
  password?: string
  form?: string
}

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loadAppUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    const trimmedEmail = email.trim()
    if (!trimmedEmail) next.email = 'Please enter your email.'
    else if (!isEmailValid(trimmedEmail))
      next.email = 'Please enter a valid email address.'
    if (!password.trim()) next.password = 'Please enter your password.'
    return next
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)

    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes('email not confirmed')) {
        setErrors({
          form: 'Please verify your email before signing in.',
        })
        return
      }

      setErrors({
        form: error.message || 'Unable to sign in right now. Please try again.',
      })
      return
    }

    if (!data.user) {
      setErrors({
        form: 'Unable to load your account. Please try again.',
      })
      return
    }

    const appUser = await loadAppUser(data.user, true)
    if (!appUser) {
      setErrors({
        form: 'Your account needs attention. Please contact support.',
      })
      return
    }

    const fromPath = (location.state as { from?: string } | null)?.from
    if (fromPath) {
      navigate(fromPath, { replace: true })
      return
    }

    navigate(appUser.is_professional ? '/dashboard' : '/search', { replace: true })
  }

  return (
    <div className="font-body flex min-h-svh flex-col items-center justify-center bg-[#1a1a1a] px-4 py-12">
      <Card className="w-full max-w-md border-white/10 shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Sign in</CardTitle>
          <CardDescription>
            Welcome back to Manoula. Sign in to continue.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="signin-email" className="text-sm leading-none font-medium">
                Email
              </label>
              <Input
                id="signin-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              {errors.email ? (
                <p className="text-destructive text-sm" role="alert">
                  {errors.email}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="signin-password"
                className="text-sm leading-none font-medium"
              >
                Password
              </label>
              <Input
                id="signin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {errors.password ? (
                <p className="text-destructive text-sm" role="alert">
                  {errors.password}
                </p>
              ) : null}
            </div>
            {errors.form ? (
              <p className="text-destructive text-sm" role="alert" aria-live="polite">
                {errors.form}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 bg-transparent">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              New to Manoula?{' '}
              <Link
                to="/signup"
                className={cn('text-primary font-medium underline-offset-4 hover:underline')}
              >
                Create an account
              </Link>
            </p>
            <p className="text-muted-foreground text-center text-sm">
              <Link
                to="/forgot-password"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Forgot your password?
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
