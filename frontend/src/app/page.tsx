const focusItems = [
  { title: "Build Jarvis dashboard", done: true },
  { title: "Organize Pepperdine calendar", done: false },
  { title: "Plan Rouke Ranch content", done: false },
];

const projects = [
  { name: "Jarvis OS", progress: 35 },
  { name: "Pepperdine", progress: 20 },
  { name: "Rouke Ranch", progress: 80 },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
            Jarvis OS
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Good evening, Sarah.
          </h1>
          <p className="mt-2 text-slate-400">
            Here is what deserves your attention right now.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold">Today&apos;s focus</h2>

            <div className="mt-5 space-y-3">
              {focusItems.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-xl bg-slate-950 p-4"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      item.done
                        ? "border-emerald-400 bg-emerald-400 text-slate-950"
                        : "border-slate-600"
                    }`}
                  >
                    {item.done ? "✓" : ""}
                  </span>

                  <span
                    className={
                      item.done
                        ? "text-slate-500 line-through"
                        : "text-slate-100"
                    }
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-900 bg-blue-950 p-6">
            <p className="text-sm font-medium text-blue-300">
              Jarvis recommendation
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Protect one focused hour tonight.
            </h2>
            <p className="mt-3 text-blue-200">
              Finish the dashboard foundation before adding calendar or email
              integrations.
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Projects</h2>

            <div className="mt-5 space-y-5">
              {projects.map((project) => (
                <div key={project.name}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{project.name}</span>
                    <span className="text-slate-400">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Mission control</h2>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-3xl font-semibold">3</p>
                <p className="mt-1 text-sm text-slate-400">Inbox items</p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-3xl font-semibold">2</p>
                <p className="mt-1 text-sm text-slate-400">Waiting on</p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-3xl font-semibold">1</p>
                <p className="mt-1 text-sm text-slate-400">Event today</p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-3xl font-semibold">6</p>
                <p className="mt-1 text-sm text-slate-400">Active projects</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}