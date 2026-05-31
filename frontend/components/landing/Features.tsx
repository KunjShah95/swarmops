'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

const features = [
  { name: 'Orchestrator', description: 'Parses GitHub issues and decomposes work into actionable tasks.', icon: '🎯' },
  { name: 'Planner', description: 'Designs fix strategy with multi-file diff planning.', icon: '🗺️' },
  { name: 'Code Writer', description: 'Writes production-ready code diffs with syntax validation.', icon: '💻' },
  { name: 'Test Runner', description: 'Validates changes with automated test execution.', icon: '🧪' },
  { name: 'Security Auditor', description: 'Scans for vulnerabilities and code quality issues.', icon: '🔒' },
  { name: 'PR Opener', description: 'Creates branch, commits, and opens a pull request.', icon: '📤' },
];

export const Features = () => {
  return (
    <div id="features" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Meet the Agent Swarm</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A sequential pipeline of specialized agents — orchestrated with FastAPI and streamed to your browser in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Card className="p-6 h-full glass border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.name}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
