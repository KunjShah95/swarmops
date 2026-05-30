import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AgentChat from '../components/AgentChat'
import DiffViewer from '../components/DiffViewer'
import TestResults from '../components/TestResults'
import SecurityReport from '../components/SecurityReport'
import PRStatus from '../components/PRStatus'

export default function RunDetail() {
  const { runId } = useParams<{ runId: string }>()
  const [loading, setLoading] = useState(true)
  const [runInfo, setRunInfo] = useState<any>(null)

  useEffect(() => {
    if (!runId) return
    fetch(`/api/issues/${runId}`)
      .then(r => r.json())
      .then(data => { setRunInfo(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [runId])

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/history" className="text-sm text-gray-400 hover:text-white transition-colors">&larr; Back to History</Link>
        <h1 className="text-xl font-bold">Run Details</h1>
        {runInfo && <StatusBadge status={runInfo.status} />}
      </div>
      {loading ? (
        <div className="text-center py-16 text-gray-400 animate-pulse">Loading...</div>
      ) : !runId ? (
        <div className="text-center py-16 text-gray-500">No run ID provided</div>
      ) : (
        <div className="space-y-6">
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
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-500/20 text-gray-400',
    running: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || ''}`}>{status}</span>
}
