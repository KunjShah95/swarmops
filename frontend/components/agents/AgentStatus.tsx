import { Agent } from '@/types';
import { motion } from 'framer-motion';

interface AgentStatusProps {
  status: Agent['status'];
}

export const AgentStatus = ({ status }: AgentStatusProps) => {
  const statusConfig = {
    Thinking: { color: 'bg-primary', label: 'Thinking', animate: true },
    Analyzing: { color: 'bg-accent', label: 'Analyzing', animate: true },
    Waiting: { color: 'bg-muted-foreground/40', label: 'Waiting', animate: false },
    Completed: { color: 'bg-emerald-500', label: 'Done', animate: false },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] ?? statusConfig.Waiting;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex h-2 w-2">
        {config.animate && (
          <motion.span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color}`}
            animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color} shadow-sm`}
          style={config.animate ? { boxShadow: '0 0 6px rgba(99,102,241,0.5)' } : undefined}
        />
      </div>
      <span className="text-[10px] font-medium text-muted-foreground/60 hidden sm:inline">
        {config.label}
      </span>
    </div>
  );
};
