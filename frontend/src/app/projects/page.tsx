"use client";

import { FormEvent, useEffect, useState } from "react";

type Project = {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: string;
  nextAction: string;
};

const starterProjects: Project[] = [
  {
    id: "jarvis-os",
    name: "Jarvis OS",
    description: "Build the personal AI operating system.",
    progress: 40,
    status: "Active",
    nextAction: "Create persistent project storage",
  },
  {
    id: "pepperdine",
    name: "Pepperdine",
    description: "Manage coursework, readings, deadlines, and research.",
    progress: 20,
    status: "Active",
    nextAction: "Import the academic calendar",
  },
  {
    id: "rouke-ranch",
    name: "Rouke Ranch",
    description: "Organize property projects, branding, and content.",
    progress: 65,
    status: "Active",
    nextAction: "Plan the next content batch",
  },
  {
    id: "finance",
    name: "Finance",
    description: "Track taxes, accounts, budgets, and major decisions.",
    progress: 15,
    status: "Planning",
    nextAction: "Define the finance dashboard",
  },
];

const storageKey = "jarvis-projects";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    try {
      const savedProjects = window.localStorage.getItem(storageKey);

      if (savedProjects) {
        setProjects(JSON.parse(savedProjects) as Project[]);
      } else {
        setProjects(starterProjects);
      }
    } catch {
      setProjects(starterProjects);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(projects));
  }, [projects, isLoaded]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      return;
    }

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: trimmedName,
      description:
        trimmedDescription || "No project description has been added yet.",
      progress: 0,
      status: "Planning",
      nextAction: "Choose the first action for this project",
    };

    setProjects((currentProjects) => [newProject, ...currentProjects]);
    setName("");
    setDescription("");
    setIsFormOpen(false);
  }

  function deleteProject(projectId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?",
    );

    if (!confirmed) {
      return;
    }

    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== projectId),
    );
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
        <p className="text-slate-400">Loading projects...</p>
      </main>
    );
  }

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

          <button
            type="button"
            onClick={() => setIsFormOpen((current) => !current)}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            {isFormOpen ? "Cancel" : "New project"}
          </button>
        </div>

        {isFormOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-xl font-semibold">Create a project</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm text-slate-300">Project name</span>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example: Home repairs"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Description</span>

                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What is this project for?"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Create project
            </button>
          </form>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.id}
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

              <button
                type="button"
                onClick={() => deleteProject(project.id)}
                className="mt-5 text-sm text-red-400 transition hover:text-red-300"
              >
                Delete project
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}