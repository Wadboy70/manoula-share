import { Route, Routes } from 'react-router-dom'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { HomePage } from '@/pages/home-page'
import { SignUpPage } from '@/pages/sign-up-page'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="bg-background flex min-h-svh flex-col">
            <SiteHeader />
            <HomePage />
            <SiteFooter />
          </div>
        }
      />
      <Route path="/signup" element={<SignUpPage />} />
    </Routes>
  )
}

export default App
