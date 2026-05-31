import { motion } from 'framer-motion';

export const TypingIndicator = ({ agentName }: { agentName?: string }) => {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex items-center gap-1 bg-white/10 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5">
        <motion.div
          className="w-1.5 h-1.5 bg-primary rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-1.5 h-1.5 bg-primary rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-1.5 h-1.5 bg-primary rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      {agentName && (
        <span className="text-xs text-muted-foreground">{agentName} is thinking...</span>
      )}
    </div>
  );
};
