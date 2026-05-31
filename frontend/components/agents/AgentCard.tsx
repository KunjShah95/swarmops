import { Agent } from '@/types';
import { Card } from '@/components/ui/card';
import { AgentStatus } from './AgentStatus';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard = ({ agent }: AgentCardProps) => {
  return (
    <Card className="p-4 flex items-center gap-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-primary/20 text-2xl border border-primary/30 group-hover:scale-110 transition-transform">
        {agent.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white truncate">{agent.name}</h4>
        <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
      </div>
      <div className="flex-shrink-0">
        <AgentStatus status={agent.status} />
      </div>
    </Card>
  );
};
