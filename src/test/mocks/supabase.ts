/**
 * Supabase auth mocks
 *
 * Call `vi.fn` only from inside `vi.hoisted(() => …)` in test files so Vitest
 * does not hit temporal-dead-zone issues with imports used in hoisted blocks.
 *
 * Example:
 *
 * ```ts
 * const signUp = vi.hoisted(() =>
 *   vi.fn(async () => ({ error: null as const })),
 * )
 * vi.mock('@/lib/supabaseClient', () => ({
 *   supabase: { auth: { signUp: signUp } },
 * }))
 * ```
 */
export type MockSignUpResult = { error: { message: string } | null }
