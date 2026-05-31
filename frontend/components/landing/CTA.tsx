import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const CTA = () => {
  return (
    <div className="py-24 relative z-10 border-t border-white/5 bg-white/[0.02]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Ready to ship a fix?</h2>
        <p className="text-xl text-muted-foreground mb-10">
          Paste a public GitHub issue and watch six agents debate, code, and open a PR — no manual triage required.
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="h-14 px-8 text-lg bg-white text-black hover:bg-white/90 rounded-xl shadow-lg shadow-white/10 transition-all hover:scale-105">
            Start Agent Swarm <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
