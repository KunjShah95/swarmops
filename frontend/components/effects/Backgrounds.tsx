'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function AuroraBackground({ className, children }: AuroraBackgroundProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0 bg-background">
        <div className="aurora-bg absolute inset-0 opacity-60" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full animate-float" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/5 blur-[150px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />
      </div>
      {children}
    </div>
  );
}

interface BeamsProps {
  className?: string;
  count?: number;
}

export function BackgroundBeams({ className, count = 6 }: BeamsProps) {
  const paths = [
    'M-100 200 Q200 100 400 250 T800 200 T1100 300',
    'M-100 300 Q300 50 500 200 T900 150 T1200 250',
    'M-100 100 Q150 300 350 150 T750 300 T1050 200',
    'M-100 400 Q250 200 450 350 T850 200 T1150 350',
    'M-100 150 Q180 350 380 200 T800 350 T1100 250',
    'M-100 350 Q220 150 420 300 T820 250 T1120 350',
  ];

  const colors = [
    'from-primary/30 via-secondary/20 to-transparent',
    'from-accent/30 via-primary/20 to-transparent',
    'from-secondary/30 via-accent/20 to-transparent',
  ];

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="beam-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(99, 102, 241, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="beam-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="beam-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {paths.slice(0, count).map((path, i) => (
          <g key={i} className="motion-safe:animate-beam" style={{ animationDelay: `${i * 1.5}s`, animationDuration: `${6 + i * 1.5}s` }}>
            <path
              d={path}
              fill="none"
              stroke={`url(#beam-gradient-${(i % 3) + 1})`}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

interface GridDotProps {
  className?: string;
}

export function GridDotBackground({ className }: GridDotProps) {
  return (
    <div className={cn('absolute inset-0 grid-dot opacity-40', className)} />
  );
}
