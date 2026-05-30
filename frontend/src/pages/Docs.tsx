export default function Docs() {
  const sections = [
    {
      title: 'What is SwarmOps?',
      content: 'SwarmOps is an autonomous DevOps agent swarm that automates the entire software development lifecycle. It uses multiple specialized AI agents working in parallel to fix issues, write code, run tests, and create pull requests — all without human intervention.',
    },
    {
      title: 'How It Works',
      content: 'When you submit an issue, SwarmOps dispatches a coordinated team of AI agents. Each agent has a specific role: understanding the problem, planning a fix, writing code, testing, reviewing for security, and creating a PR. Agents collaborate through a shared context and can re-trigger each other if issues are found.',
    },
    {
      title: 'Agent Descriptions',
      content: '',
      agents: [
        { name: 'Orchestrator', role: 'Analyzes the GitHub issue, determines fixability, decomposes into structured tasks, and assesses complexity and risk.' },
        { name: 'Planner', role: 'Designs the fix strategy with step-by-step approach, identifies exact file paths and line numbers.' },
        { name: 'Code Writer', role: 'Generates production-grade code diffs following existing code style with syntax validation.' },
        { name: 'Test Runner', role: 'Analyzes code changes and predicts test outcomes with pass/fail reporting.' },
        { name: 'Security Auditor', role: 'Scans diffs for vulnerabilities, hardcoded secrets, SQL injection, XSS, and blocks sensitive files.' },
        { name: 'PR Opener', role: 'Creates feature branches, commits changes, and opens pull requests with full descriptions including test and security results.' },
      ],
    },
    {
      title: 'API',
      content: 'SwarmOps exposes a REST API for programmatic access. Use it to trigger runs, check status, and retrieve results. All API endpoints are prefixed with /api/. For detailed API documentation, see our API reference.',
    },
    {
      title: 'FAQ',
      content: '',
      faq: [
        { q: 'How many runs can I do on the Free plan?', a: 'The Free plan includes 10 agent runs per month.' },
        { q: 'Can I use SwarmOps with private repos?', a: 'Private repos are available on the Pro plan and above.' },
        { q: 'How long does a typical run take?', a: 'Most runs complete within 2-5 minutes depending on complexity.' },
        { q: 'Is my code safe?', a: 'Agents only have access to the repos you authorize. Code is never stored outside your infrastructure.' },
      ],
    },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Documentation</h1>
      <p className="text-gray-400 mb-10">Everything you need to know about SwarmOps</p>
      <div className="space-y-8">
        {sections.map((section, i) => (
          <section key={i} className="bg-swarm-panel border border-swarm-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">{section.title}</h2>
            {section.content && <p className="text-gray-400 text-sm leading-relaxed">{section.content}</p>}
            {section.agents && (
              <div className="space-y-3">
                {section.agents.map((agent, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-swarm-primary mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium">{agent.name}</span>
                      <p className="text-sm text-gray-400">{agent.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {section.faq && (
              <div className="space-y-4">
                {section.faq.map((item, j) => (
                  <div key={j}>
                    <h3 className="text-sm font-medium mb-1">{item.q}</h3>
                    <p className="text-sm text-gray-400">{item.a}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
