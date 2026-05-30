import { useState } from 'react'
import { Link } from 'react-router-dom'
import { agentStore } from '../store/agentStore'
import AgentChat from '../components/AgentChat'
import AgentCard from '../components/AgentCard'
import DiffViewer from '../components/DiffViewer'
import TestResults from '../components/TestResults'
import SecurityReport from '../components/SecurityReport'
import PRStatus from '../components/PRStatus'

const agents = [
  { name: 'orchestrator', displayName: 'Orchestrator', icon: '🎯' },
  { name: 'planner', displayName: 'Planner', icon: '🗺️' },
  { name: 'code_writer', displayName: 'Code Writer', icon: '💻' },
  { name: 'test_runner', displayName: 'Test Runner', icon: '🧪' },
  { name: 'security_auditor', displayName: 'Security', icon: '🔒' },
  { name: 'pr_opener', displayName: 'PR Opener', icon: '📤' },
]

export default function Dashboard() {
  const [issueUrl, setIssueUrl] = useState('')
  const [runId, setRunId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issueUrl) return

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

  const handleNewRun = () => {
    agentStore.getState().reset()
    setRunId(null)
    setIssueUrl('')
  }

  return (
    <div className="flex-1 flex flex-col">
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out both;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out both;
        }
      `}</style>

      <header className="bg-swarm-panel border-b border-swarm-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handleNewRun}
            className="px-4 py-2 bg-swarm-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            + New Run
          </button>
          <div className="flex items-center gap-4">
            <Link
              to="/history"
              className="text-sm text-gray-400 hover:text-swarm-primary transition-colors"
            >
              View History
            </Link>
            <span className="w-2 h-2 bg-swarm-success rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">Ready</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <div className="lg:col-span-1 space-y-4 animate-slide-up">
          <div className="bg-swarm-panel rounded-lg border border-swarm-border p-4">
            <h2 className="text-lg font-semibold mb-4">Agent Status</h2>
            <div className="space-y-2">
              {agents.map((agent, i) => (
                <div
                  key={agent.name}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <AgentCard {...agent} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {!runId ? (
            <div className="animate-fade-in bg-swarm-panel rounded-lg border border-swarm-border p-8">
              <div className="max-w-2xl mx-auto text-center">
                <div className="text-6xl mb-6">🚀</div>
                <h2 className="text-2xl font-bold mb-2">Start an Agent Swarm</h2>
                <p className="text-gray-400 mb-8">
                  Paste a GitHub issue URL to let the autonomous agent swarm analyze,
                  code, test, and open a PR.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="url"
                      value={issueUrl}
                      onChange={(e) => setIssueUrl(e.target.value)}
                      placeholder="https://github.com/owner/repo/issues/42"
                      className="w-full px-4 py-3 bg-swarm-dark border border-swarm-border rounded-lg focus:outline-none focus:border-swarm-primary focus:ring-1 focus:ring-swarm-primary transition-all text-center text-lg"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-swarm-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all"
                  >
                    {loading ? 'Starting Swarm...' : '🚀 Auto-Fix Issue'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <AgentChat runId={runId} />
              <DiffViewer />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TestResults />
                <SecurityReport />
                <PRStatus />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
