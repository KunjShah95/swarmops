import Link from 'next/link';
import { Activity, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-5xl">
      <div className="glass-strong rounded-2xl shadow-2xl shadow-primary/5">
        <div className="flex h-14 items-center px-6 mx-auto w-full">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Activity className="h-5 w-5 text-primary transition-all duration-300 group-hover:scale-110" />
              <div className="absolute -inset-2 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gradient">SwarmOps</span>
          </Link>
          <div className="ml-auto flex items-center gap-5">
            <Link
              href="/#features"
              className="hidden md:block text-sm text-muted-foreground/80 hover:text-white transition-colors duration-300 relative after:absolute after:bottom-[-2px] after:left-0 after:h-[1.5px] after:w-0 after:bg-gradient-to-r after:from-primary after:to-secondary after:transition-all after:duration-300 hover:after:w-full"
            >
              Features
            </Link>
            <Link href="/dashboard">
              <Button variant="glow" className="h-8 px-5 text-xs rounded-xl">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
