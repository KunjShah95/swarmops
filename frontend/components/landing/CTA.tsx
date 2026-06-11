import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const CTA = () => {
  return (
    <div className="py-28 relative overflow-hidden border-t border-white/[0.02]">
      {/* Background */}
      <div className="absolute inset-0 grid-dot opacity-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/[0.03] blur-[200px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[1px] bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="glass-strong rounded-3xl p-14 lg:p-20 relative overflow-hidden">
          {/* Inner glow */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/[0.04] blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-secondary/[0.04] blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-accent mb-6 gradient-border-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Ready to Deploy
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Ready to ship a fix?
            </h2>
            <p className="text-lg text-muted-foreground/80 max-w-xl mx-auto mb-12 leading-relaxed">
              Paste a public GitHub issue and watch six autonomous agents debate, code, test, and open a PR —{' '}
              <span className="text-white/80">no manual triage required.</span>
            </p>

            <Link href="/dashboard">
              <Button
                variant="glow"
                size="lg"
                className="h-14 px-10 text-lg rounded-2xl group"
              >
                <span className="flex items-center">
                  Start Agent Swarm{' '}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
