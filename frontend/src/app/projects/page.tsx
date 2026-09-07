"use client";

import { FormEvent, useEffect, useState } from "react";

type ProjectTask = {
  id: string;
  title: string;
  status: string;
  completedAt: string | null;
  priority: string;
};

type ProjectSocialContent = {
  id: string;
  title: string;
  platform: string;
  status: string;
};

type Area = {
  id: string;
  name: string;
  slug: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  progress: number;
  status: string;
  nextAction: string | null;
  notes: string | null;
  areaId: string | null;
  area: Area | null;
  tasks: ProjectTask[];
  socialContent: ProjectSocialContent[];
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaId, setAreaId] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editAreaId, setEditAreaId] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editProgress, setEditProgress] = useState("");
  const [editNextAction, setEditNextAction] = useState("");
  const [editNotes, setEditNotes] = useState("");

  async function loadProjects() {
    setIsLoading(true);
    setError(null);

    try {
      const [projectsResponse, areasResponse] = await Promise.all([
        fetch("/api/projects", {
          cache: "no-store",
        }),
        fetch("/api/areas", {
          cache: "no-store",
        }),
      ]);

      if (!projectsResponse.ok || !areasResponse.ok) {
        throw new Error("Unable to load projects.");
      }

      const projectsData = (await projectsResponse.json()) as {
        projects: Project[];
      };

      const areasData = (await areasResponse.json()) as {
        areas: Area[];
      };

      setProjects(projectsData.projects ?? []);
      setAreas(areasData.areas ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load projects.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  function openProjectEditor(project: Project) {
    setEditingProject(project);
    setEditAreaId(project.areaId ?? "");
    setEditStatus(project.status);
    setEditProgress(String(project.progress));
    setEditNextAction(project.nextAction ?? "");
    setEditNotes(project.notes ?? "");
  }

  async function saveProjectChanges() {
    if (!editingProject) return;

    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingProject.id,
          areaId: editAreaId || null,
          status: editStatus,
          progress: Number(editProgress || 0),
          nextAction: editNextAction || null,
          notes: editNotes || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to update project.");
      }

      setEditingProject(null);
      await loadProjects();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update project.",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) return;

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          areaId: areaId || null,
          status: "PLANNING",
          progress: 0,
          nextAction: "Choose the first action for this project",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create project.");
      }

      setName("");
      setDescription("");
      setAreaId("");
      setIsFormOpen(false);

      await loadProjects();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create project.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#F3EFE7] px-6 py-8 text-[#2C2C2C] lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#B08D57]">
              Workspace
            </p>

            <h1 className="mt-3 text-4xl font-semibold text-[#1E3A34]">
              Projects
            </h1>

            <p className="mt-2 text-[#6F776B]">
              Active work that deserves sustained attention.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen((current) => !current)}
            className="rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-white"
          >
            {isFormOpen ? "Cancel" : "New project"}
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isFormOpen && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6"
          >
            <h2 className="text-xl font-semibold text-[#1E3A34]">
              Create a project
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label>
                <span className="text-sm text-[#6F776B]">
                  Project name
                </span>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example: Fence repair"
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm text-[#6F776B]">
                  Description
                </span>

                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What is this project for?"
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm text-[#6F776B]">
                  Area
                </span>

                <select
                  value={areaId}
                  onChange={(event) => setAreaId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                >
                  <option value="">No area</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 rounded-xl bg-[#B08D57] px-5 py-3 text-sm font-semibold text-white"
            >
              Create project
            </button>
          </form>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          {isLoading ? (
            <p className="text-[#6F776B]">
              Loading projects…
            </p>
          ) : (
            projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#1E3A34]">
                      {project.name}
                    </h2>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7C5F33]">
                      {project.area?.name ?? "No area"}
                    </p>

                    {project.description && (
                      <p className="mt-2 text-sm leading-6 text-[#6F776B]">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full border border-[#D7D0C5] bg-white px-3 py-1 text-xs font-semibold text-[#7C5F33]">
                    {project.status}
                  </span>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-[#6F776B]">
                      Progress
                    </span>

                    <span className="font-medium text-[#1E3A34]">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-[#D7D0C5]">
                    <div
                      className="h-2 rounded-full bg-[#B08D57]"
                      style={{
                        width: `${Math.min(100, project.progress)}%`,
                      }}
                    />
                  </div>
                </div>

                {project.nextAction && (
                  <div className="mt-6 rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B08D57]">
                      Next action
                    </p>

                    <p className="mt-2 text-sm text-[#3F4742]">
                      {project.nextAction}
                    </p>
                  </div>
                )}
                {(project.tasks.length > 0 ||
                  project.socialContent.length > 0) && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#E1DBD1] bg-white/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B08D57]">
                          Open tasks
                        </p>
                        <span className="text-xs font-semibold text-[#7C5F33]">
                          {
                            project.tasks.filter(
                              (task) =>
                                !task.completedAt &&
                                task.status.toUpperCase() !== "DONE",
                            ).length
                          }
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {project.tasks
                          .filter(
                            (task) =>
                              !task.completedAt &&
                              task.status.toUpperCase() !== "DONE",
                          )
                          .slice(0, 3)
                          .map((task) => (
                            <p
                              key={task.id}
                              className="text-sm text-[#3F4742]"
                            >
                              {task.priority === "HIGH" ? "★ " : ""}
                              {task.title}
                            </p>
                          ))}

                        {project.tasks.filter(
                          (task) =>
                            !task.completedAt &&
                            task.status.toUpperCase() !== "DONE",
                        ).length === 0 && (
                          <p className="text-sm text-[#7A826E]">
                            No open tasks.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#E1DBD1] bg-white/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B08D57]">
                          Social content
                        </p>
                        <span className="text-xs font-semibold text-[#7C5F33]">
                          {project.socialContent.length}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {project.socialContent
                          .slice(0, 3)
                          .map((item) => (
                            <div key={item.id}>
                              <p className="text-sm text-[#3F4742]">
                                {item.title}
                              </p>
                              <p className="text-xs text-[#7A826E]">
                                {item.platform} · {item.status}
                              </p>
                            </div>
                          ))}

                        {project.socialContent.length === 0 && (
                          <p className="text-sm text-[#7A826E]">
                            No linked content.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => openProjectEditor(project)}
                  className="mt-5 text-sm font-semibold text-[#7C5F33]"
                >
                  Edit project
                </button>
              </article>
            ))
          )}
        </section>
      </div>

      {editingProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
          onClick={() => setEditingProject(null)}
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-[#D7D0C5] bg-[#F8F5EF] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#1E3A34]">
                Edit {editingProject.name}
              </h2>

              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="text-sm text-[#6F776B]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label>
                <span className="text-sm">Area</span>
                <select
                  value={editAreaId}
                  onChange={(event) => setEditAreaId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                >
                  <option value="">No area</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-sm">Status</span>
                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="DONE">Done</option>
                </select>
              </label>

              <label>
                <span className="text-sm">Progress %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(event) =>
                    setEditProgress(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Next action</span>
                <input
                  value={editNextAction}
                  onChange={(event) =>
                    setEditNextAction(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Notes</span>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(event) =>
                    setEditNotes(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void saveProjectChanges()}
              className="mt-6 w-full rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-white"
            >
              Save changes
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
