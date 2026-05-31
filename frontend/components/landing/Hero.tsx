'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

export const Hero = () => {
  return (
    <div className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-accent mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
          Microsoft Build with AI 2026 · Agent Swarms
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
        >
          GitHub Issue → Fixed PR.<br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Zero Humans.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Six AI agents plan, code, test, audit, and open a pull request — streamed live to your dashboard via SSE.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-105 w-full sm:w-auto">
              Try Auto-Fix <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all w-full sm:w-auto">
              <Play className="mr-2 h-5 w-5" /> Open Dashboard
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-2 mt-12"
        >
          {['Orchestrator', 'Planner', 'Code Writer', 'Test Runner', 'Security', 'PR Opener'].map((name) => (
            <span
              key={name}
              className="px-3 py-1.5 text-xs rounded-md bg-white/5 border border-white/10 text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[300px] bg-secondary/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
    </div>
  );
};
