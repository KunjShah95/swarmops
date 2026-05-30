import { agentStore } from '../store/agentStore'

interface Finding {
  severity: string
  file: string
  line: number
  issue: string
  fix: string
}

export default function SecurityReport() {
  const messages = agentStore((s) => s.messages)
  const secMsg = messages.find((m) => m.type === 'security')
  const data = secMsg?.data as { passed?: boolean; findings?: Finding[]; summary?: string } | undefined

  if (!secMsg) {
    return (
      <div className="bg-swarm-panel rounded-lg border border-swarm-border p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-400">Security Report</h3>
        <div className="text-gray-500 text-sm text-center py-4">Security scan pending...</div>
      </div>
    )
  }

  const passed = data?.passed ?? false
  const findings = data?.findings ?? []

  return (
    <div className="bg-swarm-panel rounded-lg border border-swarm-border p-4">
      <h3 className="text-sm font-semibold mb-2 text-gray-400">Security Report</h3>
      <div className={`text-center p-2 rounded mb-2 ${passed ? 'bg-green-900/30 border border-green-700/50' : 'bg-red-900/30 border border-red-700/50'}`}>
        <div className={`text-sm font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
          {passed ? '✅ All Clear' : '⚠️ Issues Found'}
        </div>
      </div>
      {findings.length > 0 && (
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {findings.map((f, i) => (
            <div key={i} className="text-xs p-1 bg-gray-800 rounded">
              <span className={`font-medium ${f.severity === 'critical' || f.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>
                [{f.severity}]
              </span>
              <span className="text-gray-300 ml-1">{f.issue}</span>
            </div>
          ))}
        </div>
      )}
      {data?.summary && <div className="text-xs text-gray-500 mt-1">{data.summary}</div>}
    </div>
  )
}
