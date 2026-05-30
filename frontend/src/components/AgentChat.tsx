import { useRef, useEffect } from 'react'
import { agentStore } from '../store/agentStore'
import { useAgentStream } from '../hooks/useAgentStream'

interface AgentChatProps {
  runId: string
}

const agentColors: Record<string, string> = {
  orchestrator: 'bg-purple-500',
  planner: 'bg-blue-500',
  code_writer: 'bg-green-500',
  test_runner: 'bg-yellow-500',
  security_auditor: 'bg-red-500',
  pr_opener: 'bg-indigo-500',
}

const agentIcons: Record<string, string> = {
  orchestrator: '🎯',
  planner: '🗺️',
  code_writer: '💻',
  test_runner: '🧪',
  security_auditor: '🔒',
  pr_opener: '📤',
}

export default function AgentChat({ runId }: AgentChatProps) {
  const messages = agentStore((state) => state.messages)
  const runStatus = agentStore((state) => state.runStatus)
  const prUrl = agentStore((state) => state.prUrl)
  const error = agentStore((state) => state.error)
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Start SSE stream
  useAgentStream(runId)
  
  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const getStatusBadge = () => {
    if (error) return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Failed</span>
    if (runStatus === 'completed') return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Completed</span>
    if (runStatus === 'running') return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs animate-pulse">Running...</span>
    return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">Pending</span>
  }
  
  return (
    <div className="bg-swarm-panel rounded-lg border border-swarm-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-swarm-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Agent Conversation</h2>
          <p className="text-sm text-gray-400">Run ID: {runId.slice(0, 8)}...</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          {prUrl && (
            <a 
              href={prUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1 bg-swarm-primary text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              View PR →
            </a>
          )}
        </div>
      </div>
      
      {/* Messages */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-pulse">Agents are initializing...</div>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className="flex gap-3">
            {/* Agent Avatar */}
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full ${agentColors[msg.agent] || 'bg-gray-500'} flex items-center justify-center text-sm`}>
                {agentIcons[msg.agent] || '🤖'}
              </div>
            </div>
            
            {/* Message Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm capitalize">
                  {msg.agent.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-500">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {msg.content}
              </div>
              
              {/* Type-specific styling */}
              {msg.type === 'code' && (
                <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
                  <span className="text-xs text-green-400">💻 Code Generated</span>
                </div>
              )}
              
              {msg.type === 'test' && (
                <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
                  <span className="text-xs text-yellow-400">🧪 Test Results</span>
                </div>
              )}
              
              {msg.type === 'security' && (
                <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
                  <span className="text-xs text-red-400">🔒 Security Audit</span>
                </div>
              )}
              
              {msg.type === 'pr' && (
                <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700">
                  <span className="text-xs text-indigo-400">📤 Pull Request</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        <div ref={chatEndRef} />
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border-t border-red-500/20">
          <div className="text-red-400 text-sm">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
    </div>
  )
}
