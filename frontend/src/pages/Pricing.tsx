import { Link } from 'react-router-dom'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out SwarmOps',
    features: ['10 agent runs per month', 'Core agents', 'Community support', 'Public repos only'],
    cta: 'Get Started',
    href: '/signup',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For teams that ship frequently',
    features: ['100 agent runs per month', 'All 6 agents', 'Priority support', 'Private repos', 'Faster execution'],
    cta: 'Start Free Trial',
    href: '/signup',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations at scale',
    features: ['Unlimited runs', 'Dedicated agents', 'SLA guarantee', 'Custom integrations', 'On-premise option'],
    cta: 'Contact Sales',
    href: '/dashboard',
    featured: false,
  },
]

export default function Pricing() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-gray-400">Start free. Upgrade when you need more power.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map(tier => (
          <div key={tier.name} className={`rounded-xl p-6 border ${tier.featured ? 'bg-swarm-primary/5 border-swarm-primary' : 'bg-swarm-panel border-swarm-border'}`}>
            {tier.featured && <div className="text-xs text-swarm-primary font-semibold mb-2">RECOMMENDED</div>}
            <h2 className="text-xl font-bold">{tier.name}</h2>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold">{tier.price}</span>
              <span className="text-gray-400 ml-1">{tier.period}</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">{tier.description}</p>
            <ul className="space-y-3 mb-8">
              {tier.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link to={tier.href} className={`block text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tier.featured ? 'bg-swarm-primary text-white hover:bg-blue-600' : 'bg-swarm-dark border border-swarm-border text-gray-300 hover:border-swarm-primary'}`}>{tier.cta}</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
