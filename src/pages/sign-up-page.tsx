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
import { cn } from '@/lib/utils'

function fieldId(base: string) {
  return `signup-${base}`
}

export function SignUpPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (successMessage) return
    setError(null)
    setSuccessMessage(null)

    const trimmedFirst = firstName.trim()
    if (!trimmedFirst) {
      setError('Please enter your first name.')
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: trimmedFirst,
          ...(lastName.trim() ? { last_name: lastName.trim() } : {}),
        },
      },
    })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSuccessMessage(
      'Check your email to confirm your account before signing in.',
    )
  }

  if (successMessage) {
    return (
      <div className="font-body flex min-h-svh flex-col items-center justify-center bg-[#1a1a1a] px-4 py-12">
        <Card className="w-full max-w-md border-white/10 shadow-md">
          <CardContent className="pt-6 text-center">
            <p
              role="status"
              aria-live="polite"
              className="text-muted-foreground text-sm text-pretty"
            >
              {successMessage}
            </p>
          </CardContent>
          <CardFooter className="bg-transparent pt-2 pb-6">
            <p className="text-muted-foreground w-full text-center text-sm">
              <Link
                to="/"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Back to home
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="font-body flex min-h-svh flex-col items-center justify-center bg-[#1a1a1a] px-4 py-12">
      <Card className="w-full max-w-md border-white/10 shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Create an account</CardTitle>
          <CardDescription>
            Join Manoula to find certified maternal wellness support.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <label
                htmlFor={fieldId('first-name')}
                className="text-sm leading-none font-medium"
              >
                First name
              </label>
              <Input
                id={fieldId('first-name')}
                name="firstName"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(ev) => setFirstName(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor={fieldId('last-name')}
                className="text-muted-foreground text-sm leading-none font-medium"
              >
                Last name{' '}
                <span className="text-muted-foreground/80 font-normal">
                  (optional)
                </span>
              </label>
              <Input
                id={fieldId('last-name')}
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(ev) => setLastName(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor={fieldId('email')}
                className="text-sm leading-none font-medium"
              >
                Email
              </label>
              <Input
                id={fieldId('email')}
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor={fieldId('password')}
                className="text-sm leading-none font-medium"
              >
                Password
              </label>
              <Input
                id={fieldId('password')}
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>

            {error ? (
              <p
                className="text-destructive text-sm"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 bg-transparent">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Already have an account?{' '}
              <Link
                to="/signin"
                className={cn(
                  'text-primary font-medium underline-offset-4 hover:underline',
                )}
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <p className="text-muted-foreground mt-8 text-sm">
        <Link
          to="/"
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </p>
    </div>
  )
}
