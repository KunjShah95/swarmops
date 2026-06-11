'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    name: 'Orchestrator',
    tag: '01',
    description: 'Parses GitHub issues and decomposes work into actionable tasks for the swarm. Sets priorities and tracks progress across all agents.',
    color: 'from-primary/30 via-primary/10 to-transparent',
    border: 'border-primary/20 group-hover:border-primary/40',
    shadow: 'shadow-primary/5 group-hover:shadow-primary/20',
    icon: '🎯',
    size: 'md',
  },
  {
    name: 'Planner',
    tag: '02',
    description: 'Designs fix strategy with multi-file diff planning, dependency detection, and risk assessment before any code is written.',
    color: 'from-secondary/30 via-secondary/10 to-transparent',
    border: 'border-secondary/20 group-hover:border-secondary/40',
    shadow: 'shadow-secondary/5 group-hover:shadow-secondary/20',
    icon: '🗺️',
    size: 'md',
  },
  {
    name: 'Code Writer',
    tag: '03',
    description: 'Writes production-ready code diffs with syntax validation, best practices, and automatic formatting applied across all changed files.',
    color: 'from-accent/30 via-accent/10 to-transparent',
    border: 'border-accent/20 group-hover:border-accent/40',
    shadow: 'shadow-accent/5 group-hover:shadow-accent/20',
    icon: '💻',
    size: 'lg',
  },
  {
    name: 'Test Runner',
    tag: '04',
    description: 'Validates changes with automated test execution in isolated environments. Reports pass/fail with detailed error output.',
    color: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
    border: 'border-emerald-500/20 group-hover:border-emerald-500/40',
    shadow: 'shadow-emerald-500/5 group-hover:shadow-emerald-500/20',
    icon: '🧪',
    size: 'md',
  },
  {
    name: 'Security Auditor',
    tag: '05',
    description: 'Scans for vulnerabilities, hardcoded secrets, dependency risks, and code quality regressions across the full diff.',
    color: 'from-amber-500/30 via-amber-500/10 to-transparent',
    border: 'border-amber-500/20 group-hover:border-amber-500/40',
    shadow: 'shadow-amber-500/5 group-hover:shadow-amber-500/20',
    icon: '🔒',
    size: 'md',
  },
  {
    name: 'PR Opener',
    tag: '06',
    description: 'Creates a branch, commits all changes with conventional commit messages, and opens a pull request with full evidence.',
    color: 'from-rose-500/30 via-rose-500/10 to-transparent',
    border: 'border-rose-500/20 group-hover:border-rose-500/40',
    shadow: 'shadow-rose-500/5 group-hover:shadow-rose-500/20',
    icon: '📤',
    size: 'md',
  },
];

function FeatureCard({ feature, index }: { feature: (typeof features)[number]; index: number }) {
  const isLarge = feature.size === 'lg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-default',
        feature.border,
        feature.shadow,
        'hover:shadow-xl hover:-translate-y-1',
        'bg-white/[0.02]',
        isLarge ? 'lg:col-span-2 lg:row-span-1' : '',
      )}
    >
      {/* Hover gradient overlay */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700', feature.color)} />

      {/* Shimmer overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent bg-[length:200%_100%] animate-shimmer" />
      </div>

      {/* Corner glow */}
      <div className={cn(
        'absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-700',
        feature.shadow.replace('shadow-', 'bg-').replace(/\/\d+.*/, '/15'),
      )} />

      {/* Tag */}
      <div className="absolute top-5 right-5 text-[10px] font-mono text-white/[0.06] group-hover:text-white/[0.15] transition-colors duration-500 select-none">
        {feature.tag}
      </div>

      <div className="relative p-7 lg:p-8 z-10">
        <div className="flex items-start gap-5">
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border bg-white/[0.02] transition-all duration-500',
            feature.border,
            'group-hover:scale-110 group-hover:shadow-lg',
            feature.shadow,
          )}>
            {feature.icon}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-lg font-semibold text-white/90 mb-3 group-hover:text-white transition-colors duration-300">
              {feature.name}
            </h3>
            <p className="text-sm text-muted-foreground/70 leading-relaxed group-hover:text-muted-foreground/90 transition-colors duration-300">
              {feature.description}
            </p>
          </div>
        </div>
      </div>

      {/* Animated bottom border */}
      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-x-0 group-hover:scale-x-100 origin-center" />
    </motion.div>
  );
}

export const Features = () => {
  return (
    <div id="features" className="py-28 relative overflow-hidden">
      {/* Section background */}
      <div className="absolute inset-0 grid-dot opacity-20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.02] blur-[200px] rounded-full pointer-events-none" />

      {/* Divider flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-strong text-xs text-accent mb-5 gradient-border">
            <Sparkles className="h-3.5 w-3.5" />
            Pipeline
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight">
            Meet the{' '}
            <span className="text-gradient">Agent Swarm</span>
          </h2>
          <p className="text-muted-foreground/80 text-lg max-w-2xl mx-auto leading-relaxed">
            A sequential pipeline of six specialized AI agents — orchestrated with FastAPI
            and streamed to your browser in real time via SSE.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
          {features.map((feature, index) => (
            <FeatureCard key={feature.name} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-primary transition-colors duration-300 group"
          >
            See it in action
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
