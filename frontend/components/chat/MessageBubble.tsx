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
      className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-sm">
          {message.avatar}
        </div>
      )}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-white/80">{message.agentName}</span>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
        </div>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser 
            ? 'bg-primary text-white rounded-tr-none' 
            : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
        }`}>
          {message.message}
        </div>
      </div>
    </motion.div>
  );
};
