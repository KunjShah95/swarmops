export default function Settings() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <section className="bg-swarm-panel border border-swarm-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">GitHub</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">GitHub Token</label>
              <input type="password" className="w-full bg-swarm-dark border border-swarm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-swarm-primary transition-colors" placeholder="ghp_••••••••••••" defaultValue="••••••••••••••••" />
              <p className="text-xs text-gray-500 mt-1">Personal Access Token with repo scope</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Default Repository</label>
              <input type="text" className="w-full bg-swarm-dark border border-swarm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-swarm-primary transition-colors" placeholder="owner/repo" />
            </div>
          </div>
        </section>

        <section className="bg-swarm-panel border border-swarm-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Preferences</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Dark Mode</div>
              <div className="text-xs text-gray-400">Always enabled</div>
            </div>
            <div className="w-10 h-5 bg-swarm-primary rounded-full relative cursor-default">
              <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5" />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button className="py-2 px-6 bg-swarm-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">Save Settings</button>
        </div>
      </div>
    </div>
  )
}
