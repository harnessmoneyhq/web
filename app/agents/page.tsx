export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-neutral-800 selection:text-white">

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-white">
            Agents
          </h1>
          <p className="text-neutral-400 font-mono text-sm max-w-md mx-auto">
            Discover autonomous AI agents and execution framework integrations.
          </p>
        </div>
      </main>
    </div>
  );
}
