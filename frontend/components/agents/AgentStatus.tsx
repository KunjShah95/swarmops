import { Agent } from '@/types';
import { motion } from 'framer-motion';

interface AgentStatusProps {
  status: Agent['status'];
}

export const AgentStatus = ({ status }: AgentStatusProps) => {
  const statusConfig = {
    Thinking: { color: 'bg-primary', label: 'Thinking', animate: true },
    Analyzing: { color: 'bg-accent', label: 'Analyzing', animate: true },
    Waiting: { color: 'bg-muted-foreground', label: 'Waiting', animate: false },
    Completed: { color: 'bg-green-500', label: 'Completed', animate: false },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] ?? statusConfig.Waiting;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2 w-2">
        {config.animate && (
          <motion.span 
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color}`}
            animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`} />
      </div>
      <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block">
        {config.label}
      </span>
    </div>
  );
};
