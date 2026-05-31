'use client';

import { Insight } from '@/types';
import { Card } from '@/components/ui/card';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface InsightCardProps {
  insight: Insight;
}

const AnimatedCounter = ({ value }: { value: number }) => {
  const spring = useSpring(0, { duration: 2000, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

export const InsightCard = ({ insight }: InsightCardProps) => {
  const isNumber = typeof insight.value === 'number';

  return (
    <Card className="p-5 glass border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02]">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">{insight.title}</h4>
        {insight.trend && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/10 text-white">
            {insight.trend}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold mb-1 ${insight.color || 'text-white'}`}>
        {isNumber ? <AnimatedCounter value={insight.value as number} /> : insight.value}
      </div>
      <p className="text-xs text-muted-foreground opacity-80">{insight.description}</p>
    </Card>
  );
};
