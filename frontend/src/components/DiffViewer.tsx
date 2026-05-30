import { agentStore } from '../store/agentStore'

export default function DiffViewer() {
  const messages = agentStore((state) => state.messages)
  
  // Find code writer messages with diffs
  const codeMessages = messages.filter(
    (msg) => msg.type === 'code' && msg.data?.diff
  )
  
  if (codeMessages.length === 0) {
    return (
      <div className="bg-swarm-panel rounded-lg border border-swarm-border p-6">
        <h2 className="text-lg font-semibold mb-4">Code Diff</h2>
        <div className="text-gray-500 text-center py-8">
          No code changes yet. Waiting for Code Writer agent...
        </div>
      </div>
    )
  }
  
  const latestCode = codeMessages[codeMessages.length - 1]
  const diff = latestCode.data?.diff || 'No diff available'
  const filesChanged = latestCode.data?.files_changed || []
  
  return (
    <div className="bg-swarm-panel rounded-lg border border-swarm-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-swarm-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Code Changes</h2>
          <span className="text-xs text-gray-400">
            {filesChanged.length} file{filesChanged.length !== 1 ? 's' : ''} changed
          </span>
        </div>
        
        {/* File tabs */}
        {filesChanged.length > 0 && (
          <div className="flex gap-2 mt-3">
            {filesChanged.map((file: string, index: number) => (
              <button
                key={index}
                className="px-3 py-1 text-xs bg-swarm-dark border border-swarm-border rounded hover:border-swarm-primary transition-colors"
              >
                {file}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Diff Content */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono">
          {diff.split('\n').map((line: string, index: number) => {
            let lineClass = 'text-gray-300'
            
            if (line.startsWith('+')) {
              lineClass = 'text-green-400 bg-green-500/10'
            } else if (line.startsWith('-')) {
              lineClass = 'text-red-400 bg-red-500/10'
            } else if (line.startsWith('@@')) {
              lineClass = 'text-blue-400'
            } else if (line.startsWith('---') || line.startsWith('+++')) {
              lineClass = 'text-gray-500 font-semibold'
            }
            
            return (
              <div key={index} className={`${lineClass} px-2 py-0.5`}>
                {line}
              </div>
            )
          })}
        </pre>
      </div>
      
      {/* Summary */}
      {latestCode.data?.summary && (
        <div className="p-4 border-t border-swarm-border bg-swarm-dark/50">
          <div className="text-sm text-gray-400">
            <strong className="text-gray-300">Summary:</strong> {latestCode.data.summary}
          </div>
        </div>
      )}
    </div>
  )
}
