import { agentStore } from '../store/agentStore'

export default function PRStatus() {
  const prUrl = agentStore((s) => s.prUrl)
  const runStatus = agentStore((s) => s.runStatus)
  const messages = agentStore((s) => s.messages)
  const prMsg = messages.find((m) => m.type === 'pr')
  const data = prMsg?.data as { pr_number?: number; branch?: string } | undefined

  return (
    <div className="bg-swarm-panel rounded-lg border border-swarm-border p-4 flex flex-col">
      <h3 className="text-sm font-semibold mb-2 text-gray-400">Pull Request</h3>
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        {prUrl ? (
          <>
            <div className="text-2xl">📤</div>
            <a href={prUrl} target="_blank" rel="noopener noreferrer"
               className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors">
              View PR #{data?.pr_number ?? ''} →
            </a>
            {data?.branch && <div className="text-xs text-gray-500">Branch: {data.branch}</div>}
          </>
        ) : runStatus === 'completed' ? (
          <div className="text-gray-500 text-xs text-center">No PR was created</div>
        ) : (
          <>
            <div className="text-2xl opacity-30">📤</div>
            <div className="text-gray-500 text-xs">Waiting for PR...</div>
          </>
        )}
      </div>
    </div>
  )
}
