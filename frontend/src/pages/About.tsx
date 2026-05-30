export default function About() {
  const techStack = [
    { name: 'React 18 + TypeScript', role: 'Frontend UI with type safety' },
    { name: 'Vite + Tailwind CSS', role: 'Fast builds & utility-first styling' },
    { name: 'FastAPI (Python)', role: 'Async backend with SSE streaming' },
    { name: 'SQLite + SQLAlchemy', role: 'Lightweight persistent storage' },
    { name: 'Groq / Gemini / OpenRouter', role: 'Multi-provider LLM routing with fallback' },
    { name: 'GitHub REST API', role: 'Issue fetching & PR creation' },
  ]

  const team = [
    { name: 'Kunj Shah', role: 'Full-stack developer & AI enthusiast' },
  ]

  const agents = [
    { name: 'Orchestrator', role: 'Issue analysis & task decomposition' },
    { name: 'Planner', role: 'Fix strategy & file path identification' },
    { name: 'Code Writer', role: 'Diff generation & code fixes' },
    { name: 'Test Runner', role: 'Test outcome analysis & reporting' },
    { name: 'Security Auditor', role: 'Vulnerability scanning & sensitive file blocking' },
    { name: 'PR Opener', role: 'Branch creation & pull request generation' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">About SwarmOps</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">An autonomous DevOps agent swarm that fixes issues and ships code — built for the Microsoft Build with AI 2026 Hackathon.</p>
      </div>

      <section className="bg-swarm-panel border border-swarm-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">The Idea</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          SwarmOps was born from the observation that developers spend too much time on repetitive DevOps tasks. By leveraging six specialized AI agents working in sequence, we automate the entire pipeline from issue to pull request. Each agent focuses on one aspect of the workflow, creating a coordinated swarm that ships code faster than any single agent could. The entire process streams live to a dashboard via Server-Sent Events.
        </p>
      </section>

      <section className="bg-swarm-panel border border-swarm-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">The 6-Agent Pipeline</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agents.map(a => (
            <div key={a.name} className="flex items-center gap-3 p-3 bg-swarm-dark rounded-lg">
              <span className="w-2 h-2 rounded-full bg-swarm-primary flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs text-gray-400">{a.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-swarm-panel border border-swarm-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {techStack.map(t => (
            <div key={t.name} className="flex items-center gap-3 p-3 bg-swarm-dark rounded-lg">
              <span className="w-2 h-2 rounded-full bg-swarm-primary flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-gray-400">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-swarm-panel border border-swarm-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Team</h2>
        <p className="text-sm text-gray-400">Built with passion by developers, for developers.</p>
        <div className="mt-4 space-y-3">
          {team.map((member, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-swarm-dark rounded-lg">
              <div className="w-8 h-8 rounded-full bg-swarm-primary/20 flex items-center justify-center text-swarm-primary text-sm font-bold">S</div>
              <div>
                <div className="text-sm font-medium">{member.name}</div>
                <div className="text-xs text-gray-400">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center py-8">
        <p className="text-sm text-gray-500">Built for Microsoft Build with AI 2026</p>
      </div>
    </div>
  )
}
