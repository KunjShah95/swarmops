import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-swarm-panel border border-swarm-border rounded-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-sm text-gray-400 text-center mb-8">Sign in to your SwarmOps account</p>
        <form className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" className="w-full bg-swarm-dark border border-swarm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-swarm-primary transition-colors" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input type="password" className="w-full bg-swarm-dark border border-swarm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-swarm-primary transition-colors" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-2 px-4 bg-swarm-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">Sign In</button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-6">
          Don't have an account? <Link to="/signup" className="text-swarm-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
