import { agentStore } from '../store/agentStore'

export default function TestResults() {
  const messages = agentStore((s) => s.messages)
  const testMsg = messages.find((m) => m.type === 'test')
  const data = testMsg?.data as { tests_passed?: number; tests_failed?: number; total_tests?: number; output?: string; success?: boolean } | undefined

  if (!testMsg) {
    return (
      <div className="bg-swarm-panel rounded-lg border border-swarm-border p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-400">Test Results</h3>
        <div className="text-gray-500 text-sm text-center py-4">Waiting for test results...</div>
      </div>
    )
  }

  const passed = data?.tests_passed ?? 0
  const failed = data?.tests_failed ?? 0
  const success = data?.success ?? false

  return (
    <div className="bg-swarm-panel rounded-lg border border-swarm-border p-4">
      <h3 className="text-sm font-semibold mb-2 text-gray-400">Test Results</h3>
      <div className="flex gap-3 mb-2">
        <div className="flex-1 text-center p-2 bg-green-900/30 rounded border border-green-700/50">
          <div className="text-xl font-bold text-green-400">{passed}</div>
          <div className="text-xs text-green-300">Passed</div>
        </div>
        <div className="flex-1 text-center p-2 bg-red-900/30 rounded border border-red-700/50">
          <div className="text-xl font-bold text-red-400">{failed}</div>
          <div className="text-xs text-red-300">Failed</div>
        </div>
      </div>
      {success
        ? <div className="text-xs text-green-400">✅ All tests passed</div>
        : <div className="text-xs text-red-400">❌ Some tests failed</div>
      }
    </div>
  )
}
