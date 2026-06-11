import { ChatMessage } from '@/types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.agentId === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 mb-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-sm">
          {message.avatar}
        </div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <span className="text-[11px] font-semibold text-white/60">{message.agentName}</span>
          <span className="text-[10px] text-muted-foreground/40">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
        </div>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-tr-[4px]'
            : 'bg-white/[0.03] border border-white/[0.06] text-white/80 rounded-tl-[4px]'
        }`}>
          {message.message}
        </div>
      </div>
    </motion.div>
  );
};
