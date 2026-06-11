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
    <Card className="p-5 glass border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-muted-foreground group-hover:text-white/80 transition-colors duration-300">{insight.title}</h4>
        {insight.trend && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {insight.trend}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold mb-1 ${insight.color || 'text-white'} group-hover:text-gradient transition-all duration-300`}>
        {isNumber ? <AnimatedCounter value={insight.value as number} /> : insight.value}
      </div>
      <p className="text-xs text-muted-foreground opacity-80">{insight.description}</p>
    </Card>
  );
};
