'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AuroraBackground, BackgroundBeams, GridDotBackground } from '@/components/effects/Backgrounds';

export const Hero = () => {
  return (
    <AuroraBackground className="min-h-screen flex items-center justify-center">
      <BackgroundBeams count={6} />
      <GridDotBackground />

      {/* Gradient overlay at bottom for smooth transition */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-background to-transparent z-10" />
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-background to-transparent z-10" />

      {/* Floating glow orbs */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/8 blur-[150px] rounded-full animate-float pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-accent/5 blur-[150px] rounded-full animate-float pointer-events-none" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 blur-[200px] rounded-full animate-pulse-glow pointer-events-none" />

      <div className="relative z-20 max-w-6xl mx-auto px-6 text-center pt-32 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full glass-strong text-sm text-accent mb-10 gradient-border"
        >
          <span className="flex h-2 w-2 rounded-full bg-accent shadow-lg shadow-accent/50 animate-pulse" />
          Microsoft Build with AI 2026
          <Sparkles className="h-3.5 w-3.5 text-accent/60" />
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold tracking-tight leading-[1.05] mb-8"
        >
          <span className="text-white">GitHub Issue →</span>
          <br />
          <span className="text-gradient drop-shadow-[0_0_40px_rgba(99,102,241,0.3)]">Fixed PR.</span>
          <br />
          <span className="text-white/30 text-4xl sm:text-5xl md:text-6xl lg:text-7xl block mt-2">Zero Humans.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Six AI agents orchestrate end-to-end —{' '}
          <span className="text-white/90 font-medium">plan</span>,{' '}
          <span className="text-white/90 font-medium">code</span>,{' '}
          <span className="text-white/90 font-medium">test</span>,{' '}
          <span className="text-white/90 font-medium">audit</span>, and{' '}
          <span className="text-white/90 font-medium">ship</span> — streamed live to your dashboard.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <Link href="/dashboard">
            <Button
              variant="glow"
              size="lg"
              className="h-14 px-10 text-lg rounded-2xl group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Try Auto-Fix
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </span>
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-10 text-lg rounded-2xl border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-white transition-all duration-300"
            >
              <Play className="mr-2 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Agent tags */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
          className="flex flex-wrap justify-center gap-3 mt-16"
        >
          {[
            { name: 'Orchestrator', gradient: 'from-primary/30 to-primary/5' },
            { name: 'Planner', gradient: 'from-secondary/30 to-secondary/5' },
            { name: 'Code Writer', gradient: 'from-accent/30 to-accent/5' },
            { name: 'Test Runner', gradient: 'from-emerald-400/30 to-emerald-400/5' },
            { name: 'Security', gradient: 'from-amber-400/30 to-amber-400/5' },
            { name: 'PR Opener', gradient: 'from-rose-400/30 to-rose-400/5' },
          ].map(({ name, gradient }) => (
            <span
              key={name}
              className="group relative px-5 py-2.5 text-xs font-medium rounded-full bg-white/[0.02] border border-white/[0.06] text-muted-foreground/70 hover:text-white transition-all duration-500 cursor-default overflow-hidden"
            >
              <span className={`absolute inset-0 bg-gradient-to-b ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <span className="relative z-10">{name}</span>
            </span>
          ))}
        </motion.div>
      </div>
    </AuroraBackground>
  );
};
