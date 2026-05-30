import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-swarm-dark text-white flex flex-col">
      <nav className="bg-swarm-panel border-b border-swarm-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-swarm-primary">SwarmOps</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
              <Link to="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
              <Link to="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">Docs</Link>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">Sign In</Link>
              <Link to="/dashboard" className="px-4 py-2 text-sm bg-swarm-primary text-white rounded-lg hover:bg-blue-600 transition-colors">Get Started</Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link to="/#features" className="block px-3 py-2 text-sm text-gray-400">Features</Link>
              <Link to="/pricing" className="block px-3 py-2 text-sm text-gray-400">Pricing</Link>
              <Link to="/docs" className="block px-3 py-2 text-sm text-gray-400">Docs</Link>
              <Link to="/login" className="block px-3 py-2 text-sm text-gray-400">Sign In</Link>
              <Link to="/dashboard" className="block px-3 py-2 text-sm text-swarm-primary">Get Started</Link>
            </div>
          )}
        </div>
      </nav>
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-swarm-panel border-t border-swarm-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>SwarmOps &mdash; Autonomous DevOps Agent Swarm</p>
          <p className="mt-1">Built for Microsoft Build with AI 2026</p>
          <p className="mt-2">
            <a className="text-swarm-primary hover:underline" href="https://github.com/KunjShah95/SENTINEL-CLI/issues" target="_blank" rel="noreferrer">Repository issues</a>
            <span className="mx-2">•</span>
            <a className="text-swarm-primary hover:underline" href="https://github.com/KunjShah95/SENTINEL-CLI/issues/8" target="_blank" rel="noreferrer">Example: issue #8</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
