import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface Run {
  run_id: string
  repo: string
  issue_number: number
  status: string
  created_at: string
  pr_url: string | null
}

export default function History() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/runs')
      .then(r => r.json())
      .then(data => { setRuns(data.runs); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading runs...</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Run History</h1>
      {runs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-lg mb-2">No runs yet</p>
          <p className="text-sm">Start by fixing an issue.</p>
          <Link to="/dashboard" className="inline-block mt-4 px-4 py-2 bg-swarm-primary text-white rounded-lg text-sm">Go to Dashboard</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map(run => (
            <Link key={run.run_id} to={`/runs/${run.run_id}`} className="block bg-swarm-panel border border-swarm-border rounded-lg p-4 hover:border-swarm-primary transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={run.status} />
                  <span className="text-sm font-medium">{run.repo}</span>
                  <span className="text-sm text-gray-400">#{run.issue_number}</span>
                </div>
                <span className="text-xs text-gray-500">{run.created_at ? new Date(run.created_at).toLocaleDateString() : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-500/20 text-gray-400',
    running: 'bg-blue-500/20 text-blue-400 animate-pulse',
    completed: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>{status}</span>
}
