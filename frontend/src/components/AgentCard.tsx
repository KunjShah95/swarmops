import { agentStore } from '../store/agentStore'

interface AgentCardProps {
  name: string
  displayName: string
  icon: string
}

const statusColors: Record<string, string> = {
  idle: 'bg-gray-500',
  thinking: 'bg-yellow-500 animate-pulse',
  speaking: 'bg-green-500',
  waiting: 'bg-blue-500',
  error: 'bg-red-500',
  completed: 'bg-green-500',
}

export default function AgentCard({ name, displayName, icon }: AgentCardProps) {
  const status = agentStore((state) => state.agentStatuses[name])
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-swarm-dark border border-swarm-border">
      {/* Status Indicator */}
      <div className={`w-2 h-2 rounded-full ${statusColors[status] || 'bg-gray-500'}`} />
      
      {/* Agent Icon */}
      <span className="text-lg">{icon}</span>
      
      {/* Agent Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{displayName}</div>
        <div className="text-xs text-gray-400 capitalize">{status}</div>
      </div>
    </div>
  )
}
