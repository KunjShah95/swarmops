import { useState } from 'react'
import './App.css'
import AgentChat from './components/AgentChat'
import AgentCard from './components/AgentCard'
import DiffViewer from './components/DiffViewer'
import TestResults from './components/TestResults'
import SecurityReport from './components/SecurityReport'
import PRStatus from './components/PRStatus'

function App() {
  const [issueUrl, setIssueUrl] = useState('')
  const [runId, setRunId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issueUrl) return

    // Parse GitHub URL
    const match = issueUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/)
    if (!match) {
      alert('Please enter a valid GitHub issue URL')
      return
    }

    const [, owner, repo, issueNumber] = match
    const repoName = `${owner}/${repo}`

    setLoading(true)
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_url: issueUrl,
          repo: repoName,
          issue_number: parseInt(issueNumber),
        }),
      })

      const data = await response.json()
      setRunId(data.run_id)
    } catch (error) {
      console.error('Failed to start swarm:', error)
      alert('Failed to start agent swarm')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-swarm-dark text-white">
      {/* Header */}
      <header className="bg-swarm-panel border-b border-swarm-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-swarm-primary">SwarmOps</h1>
            <p className="text-sm text-gray-400">Autonomous DevOps Agent Swarm</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-swarm-success rounded-full animate-pulse"></span>
            <span className="text-sm text-gray-400">Ready</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Agent Status */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-swarm-panel rounded-lg border border-swarm-border p-4">
            <h2 className="text-lg font-semibold mb-4">Agent Status</h2>
            <div className="space-y-2">
              <AgentCard name="orchestrator" displayName="Orchestrator" icon="🎯" />
              <AgentCard name="planner" displayName="Planner" icon="🗺️" />
              <AgentCard name="code_writer" displayName="Code Writer" icon="💻" />
              <AgentCard name="test_runner" displayName="Test Runner" icon="🧪" />
              <AgentCard name="security_auditor" displayName="Security" icon="🔒" />
              <AgentCard name="pr_opener" displayName="PR Opener" icon="📤" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Issue Input */}
          {!runId && (
            <div className="bg-swarm-panel rounded-lg border border-swarm-border p-6">
              <h2 className="text-xl font-semibold mb-4">Start Agent Swarm</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    GitHub Issue URL
                  </label>
                  <input
                    type="url"
                    value={issueUrl}
                    onChange={(e) => setIssueUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo/issues/42"
                    className="w-full px-4 py-2 bg-swarm-dark border border-swarm-border rounded-lg focus:outline-none focus:border-swarm-primary"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-swarm-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Starting Swarm...' : '🚀 Auto-Fix Issue'}
                </button>
              </form>
            </div>
          )}

          {/* Agent Chat */}
          {runId && (
            <>
              <AgentChat runId={runId} />
              <DiffViewer runId={runId} />
              {/* Bottom row: test results, security report, PR status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TestResults />
                <SecurityReport />
                <PRStatus />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
