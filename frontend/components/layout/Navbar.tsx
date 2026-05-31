import Link from 'next/link';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center px-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight text-white">SwarmOps</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/#features" className="hidden md:block text-sm text-muted-foreground hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/dashboard">
            <Button className="bg-primary text-white hover:bg-primary/90">Dashboard</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
