import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { HomePage } from '@/pages/home-page'

function App() {
  return (
    <div className="bg-background flex min-h-svh flex-col">
      <SiteHeader />
      <HomePage />
      <SiteFooter />
    </div>
  )
}

export default App
