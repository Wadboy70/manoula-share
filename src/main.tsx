import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { appRouteObjects } from '@/app-routes'
import { AuthProvider } from '@/features/auth'
import '@/index.css'

const router = createBrowserRouter(appRouteObjects)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
