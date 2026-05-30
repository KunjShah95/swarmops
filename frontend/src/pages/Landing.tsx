import { Link } from 'react-router-dom'

const agents = [
  { name: 'Orchestrator', icon: '🎯', color: '#8b5cf6', desc: 'Parses GitHub issues and decomposes into actionable tasks' },
  { name: 'Planner', icon: '🗺️', color: '#6366f1', desc: 'Designs fix strategy with multi-file diff planning' },
  { name: 'Code Writer', icon: '💻', color: '#10b981', desc: 'Writes production-ready code diffs with syntax validation' },
  { name: 'Test Runner', icon: '🧪', color: '#eab308', desc: 'Validates changes with automated test execution' },
  { name: 'Security', icon: '🔒', color: '#ef4444', desc: 'Scans for vulnerabilities and code quality issues' },
  { name: 'PR Opener', icon: '📤', color: '#6366f1', desc: 'Creates branch, commits, and opens a pull request' },
]

const steps = [
  { num: '01', title: 'Paste Issue', desc: 'Drop a GitHub issue URL into the dashboard' },
  { num: '02', title: 'Agents Plan', desc: '6 specialized AI agents analyze and design the fix' },
  { num: '03', title: 'Code & Test', desc: 'Code is written, tested, and security-audited automatically' },
  { num: '04', title: 'PR Opened', desc: 'A pull request is created with full evidence of the fix' },
]

export default function Landing() {
  return (
    <div>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out both;
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
      `}</style>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="animate-slide-up">
            <span className="inline-block px-3 py-1 bg-swarm-primary/10 border border-swarm-primary/20 rounded-full text-xs text-swarm-primary font-medium mb-6">
              Microsoft Build with AI 2026
            </span>
          </div>
          <h1 className="animate-slide-up delay-1 text-5xl md:text-6xl font-bold leading-tight mb-4">
            GitHub Issue → Fixed PR.<br />
            <span className="text-swarm-primary">Zero Humans.</span>
          </h1>
          <p className="animate-slide-up delay-2 text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            6 AI agents plan, code, test, audit, and open a PR. Watch them debate your fix in real-time.
          </p>
          <div className="animate-slide-up delay-3 flex items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-swarm-primary text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-base"
            >
              Try It Now →
            </Link>
            <Link
              to="/docs"
              className="px-6 py-3 border border-swarm-border text-gray-300 rounded-lg hover:border-gray-500 transition-colors font-medium text-base"
            >
              Watch Demo
            </Link>
          </div>
          <div className="animate-slide-up delay-4 flex items-center justify-center gap-2 md:gap-3 mt-12 flex-wrap">
            {['Orchestrator', 'Planner', 'Code Writer', 'Test Runner', 'Security'].map((name, i) => (
              <span
                key={name}
                className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-md text-xs text-gray-500"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-swarm-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Meet the Swarm</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Six specialized AI agents working together to fix your issues end-to-end.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="bg-swarm-panel border border-swarm-border rounded-xl p-5 hover:border-swarm-primary/50 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{agent.icon}</span>
                  <div>
                    <div className="text-xs font-semibold tracking-wider" style={{ color: agent.color }}>
                      {agent.name.toUpperCase().replace(' ', '_')}
                    </div>
                    <div className="text-sm font-medium text-white mt-0.5">{agent.name}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-t border-swarm-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From issue to PR in four simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {steps.map((step, i) => (
              <div key={step.num} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px border-t border-dashed border-gray-700" />
                )}
                <div className="w-16 h-16 rounded-full bg-swarm-primary/10 border border-swarm-primary/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-swarm-primary font-bold">{step.num}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-swarm-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate Your DevOps?</h2>
          <p className="text-gray-400 mb-8">
            Start fixing issues with zero human intervention.
          </p>
          <Link
            to="/dashboard"
            className="inline-block px-8 py-3 bg-swarm-primary text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-base"
          >
            Get Started →
          </Link>
        </div>
      </section>
    </div>
  )
}
