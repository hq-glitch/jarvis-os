"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AreaTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
};

type AreaProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  nextAction: string | null;
  tasks?: AreaTask[];
};

type Area = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  projects: AreaProject[];
  tasks: AreaTask[];
};

type AreaWorkspaceProps = {
  slug: string;
  eyebrow?: string;
};

function isOpenTask(task: AreaTask) {
  return !task.completedAt && task.status.toUpperCase() !== "DONE";
}

export default function AreaWorkspace({
  slug,
  eyebrow = "Area",
}: AreaWorkspaceProps) {
  const [area, setArea] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadArea() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/areas", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load Area.");
        }

        const data = (await response.json()) as {
          areas: Area[];
        };

        const match = (data.areas ?? []).find(
          (candidate) => candidate.slug === slug,
        );

        if (!match) {
          throw new Error("Area not found.");
        }

        if (!cancelled) {
          setArea(match);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load Area.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadArea();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const activeProjects = useMemo(() => {
    if (!area) return [];

    return area.projects.filter(
      (project) =>
        project.status.toUpperCase() !== "DONE" &&
        project.status.toUpperCase() !== "ARCHIVED",
    );
  }, [area]);

  const openStandaloneTasks = useMemo(() => {
    if (!area) return [];

    return area.tasks.filter(isOpenTask);
  }, [area]);

  const nextActions = useMemo(() => {
    return activeProjects
      .filter((project) => project.nextAction)
      .map((project) => ({
        projectId: project.id,
        projectName: project.name,
        nextAction: project.nextAction as string,
      }));
  }, [activeProjects]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F3EFE7] px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl text-[#6F776B]">
          Loading Area…
        </div>
      </main>
    );
  }

  if (error || !area) {
    return (
      <main className="min-h-screen bg-[#F3EFE7] px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error ?? "Area not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3EFE7] px-6 py-8 text-[#2C2C2C] lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#B08D57]">
            {eyebrow}
          </p>

          <h1 className="mt-3 text-4xl font-semibold text-[#1E3A34]">
            {area.name}
          </h1>

          {area.description && (
            <p className="mt-2 max-w-3xl text-[#6F776B]">
              {area.description}
            </p>
          )}
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B08D57]">
              Active projects
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1E3A34]">
              {activeProjects.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B08D57]">
              Standalone tasks
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1E3A34]">
              {openStandaloneTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B08D57]">
              Next actions
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1E3A34]">
              {nextActions.length}
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-[#1E3A34]">
                Projects
              </h2>

              <Link
                href="/projects"
                className="text-sm font-semibold text-[#7C5F33]"
              >
                Manage projects
              </Link>
            </div>

            <div className="mt-5 space-y-4">
              {activeProjects.length === 0 ? (
                <p className="text-sm text-[#6F776B]">
                  No active projects in this Area.
                </p>
              ) : (
                activeProjects.map((project) => (
                  <article
                    key={project.id}
                    className="rounded-xl border border-[#E1DBD1] bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[#1E3A34]">
                          {project.name}
                        </h3>

                        {project.description && (
                          <p className="mt-1 text-sm text-[#6F776B]">
                            {project.description}
                          </p>
                        )}
                      </div>

                      <span className="text-xs font-semibold text-[#7C5F33]">
                        {project.progress}%
                      </span>
                    </div>

                    {project.nextAction && (
                      <div className="mt-4 rounded-lg bg-[#F3EFE7] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B08D57]">
                          Next action
                        </p>
                        <p className="mt-1 text-sm text-[#3F4742]">
                          {project.nextAction}
                        </p>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6">
            <h2 className="text-xl font-semibold text-[#1E3A34]">
              Standalone tasks
            </h2>

            <div className="mt-5 space-y-3">
              {openStandaloneTasks.length === 0 ? (
                <p className="text-sm text-[#6F776B]">
                  No standalone tasks need attention.
                </p>
              ) : (
                openStandaloneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-[#E1DBD1] bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium text-[#3F4742]">
                        {task.title}
                      </p>

                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7C5F33]">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {nextActions.length > 0 && (
          <section className="mt-6 rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6">
            <h2 className="text-xl font-semibold text-[#1E3A34]">
              Next actions
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {nextActions.map((item) => (
                <div
                  key={item.projectId}
                  className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B08D57]">
                    {item.projectName}
                  </p>
                  <p className="mt-2 text-sm text-[#3F4742]">
                    {item.nextAction}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
