const projects = [
  {
    name: "Jarvis OS",
    description: "Build the personal AI operating system.",
    progress: 40,
    status: "Active",
    nextAction: "Create interactive project cards",
  },
  {
    name: "Pepperdine",
    description: "Manage coursework, readings, deadlines, and research.",
    progress: 20,
    status: "Active",
    nextAction: "Import the academic calendar",
  },
  {
    name: "Rouke Ranch",
    description: "Organize property projects, branding, and content.",
    progress: 65,
    status: "Active",
    nextAction: "Plan the next content batch",
  },
  {
    name: "Finance",
    description: "Track taxes, accounts, budgets, and major decisions.",
    progress: 15,
    status: "Planning",
    nextAction: "Define the finance dashboard",
  },
];

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
              Workspace
            </p>
            <h1 className="mt-3 text-4xl font-semibold">Projects</h1>
            <p className="mt-2 text-slate-400">
              Keep every major area of your life organized in one place.
            </p>
          </div>

          <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500">
            New project
          </button>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.name}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{project.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {project.description}
                  </p>
                </div>

                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
                  {project.status}
                </span>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-400">Progress</span>
                  <span>{project.progress}%</span>
                </div>

                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-slate-950 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Next action
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {project.nextAction}
                </p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}