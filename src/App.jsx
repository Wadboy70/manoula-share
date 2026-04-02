import { Header } from './components/Header.jsx'
import { Footer } from './components/Footer.jsx'
import { HomePage } from './pages/HomePage.jsx'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <Header />
      <HomePage />
      <Footer />
    </div>
  )
}

export default App
