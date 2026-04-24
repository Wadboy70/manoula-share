import { type ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, type RenderResult } from '@testing-library/react'

import App from '@/App'
import { AuthProvider } from '@/features/auth'

export function renderWithApp(
  initialEntries: string[] = ['/'],
  ui: ReactElement | null = null,
): RenderResult {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui ?? <App />}</AuthProvider>
    </MemoryRouter>,
  )
}
