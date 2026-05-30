import { useEffect, useState } from 'react'

interface PR {
  run_id: string
  pr_url: string
  issue_url: string
  repo: string
  created_at: string
}

export default function PRs() {
  const [prs, setPrs] = useState<PR[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/prs')
      .then(r => r.json())
      .then(data => { setPrs(data.prs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading PRs...</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pull Requests</h1>
      {prs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-4">📤</div>
          <p className="text-lg mb-2">No PRs created yet</p>
          <p className="text-sm">PRs will appear here once agents complete a run.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prs.map(pr => (
            <a key={pr.run_id} href={pr.pr_url} target="_blank" rel="noopener noreferrer"
               className="block bg-swarm-panel border border-swarm-border rounded-lg p-4 hover:border-swarm-primary transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{pr.repo}</span>
                  <span className="text-sm text-swarm-primary ml-2">PR</span>
                </div>
                <span className="text-xs text-gray-500">{pr.created_at ? new Date(pr.created_at).toLocaleDateString() : ''}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
