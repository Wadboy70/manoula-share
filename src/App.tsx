import { useRoutes } from 'react-router-dom'

import { appRouteObjects } from '@/app-routes'

/** Renders the shared route tree (for tests using MemoryRouter, etc.). */
export default function App() {
  return useRoutes(appRouteObjects)
}
