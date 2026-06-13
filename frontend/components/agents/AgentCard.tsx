import { Agent } from '@/types';
import { Card } from '@/components/ui/card';
import { AgentStatus } from './AgentStatus';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: Agent;
}

const agentGradients: Record<string, string> = {
  orchestrator: 'from-primary/20 to-primary/5',
  planner: 'from-secondary/20 to-secondary/5',
  code_writer: 'from-accent/20 to-accent/5',
  test_runner: 'from-emerald-500/20 to-emerald-500/5',
  security_auditor: 'from-amber-500/20 to-amber-500/5',
  pr_opener: 'from-rose-500/20 to-rose-500/5',
};

const agentBorders: Record<string, string> = {
  orchestrator: 'border-primary/20 group-hover:border-primary/40',
  planner: 'border-secondary/20 group-hover:border-secondary/40',
  code_writer: 'border-accent/20 group-hover:border-accent/40',
  test_runner: 'border-emerald-500/20 group-hover:border-emerald-500/40',
  security_auditor: 'border-amber-500/20 group-hover:border-amber-500/40',
  pr_opener: 'border-rose-500/20 group-hover:border-rose-500/40',
};

export const AgentCard = ({ agent }: AgentCardProps) => {
  const key = agent.key || agent.name.toLowerCase().replace(/\s+/g, '_');
  const gradient = agentGradients[key] || agentGradients.orchestrator;
  const border = agentBorders[key] || agentBorders.orchestrator;

  return (
    <Card className={cn(
      'p-4 flex items-center gap-4 glass border-white/[0.06] hover:bg-white/[0.05] transition-all duration-300 cursor-pointer group relative overflow-hidden',
      'hover:-translate-y-0.5',
    )}>
      <div className={cn(
        'absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        gradient,
      )} />
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.03] text-2xl border border-white/[0.06] group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 relative z-10">
        {agent.avatar}
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <h4 className="text-sm font-semibold text-white truncate group-hover:text-gradient transition-all duration-300">{agent.name}</h4>
        <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
      </div>
      <div className="flex-shrink-0 relative z-10">
        <AgentStatus status={agent.status} />
      </div>
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500',
      )} />
    </Card>
  );
};
