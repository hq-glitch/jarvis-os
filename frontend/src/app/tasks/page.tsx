"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  sourceType: string | null;
  sourceAccount: string | null;
  sourceMessageId: string | null;
  sourceThreadId: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
};

type Project = {
  id: string;
  name: string;
  status: string;
};

function formatDueDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("NORMAL");
  const [editDueDate, setEditDueDate] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);

  async function loadTasks() {
    setIsLoading(true);

    try {
      const [taskResponse, projectResponse] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
      ]);

      if (!taskResponse.ok) {
        throw new Error("Unable to load tasks.");
      }

      const taskData = (await taskResponse.json()) as {
        tasks: Task[];
      };

      setTasks(taskData.tasks ?? []);

      if (projectResponse.ok) {
        const projectData = (await projectResponse.json()) as {
          projects: Project[];
        };

        setProjects(projectData.projects ?? []);
      }
    } catch (error) {
      setTaskError(
        error instanceof Error
          ? error.message
          : "Unable to load tasks.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const openTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !task.completedAt &&
          task.status.toUpperCase() !== "DONE",
      ),
    [tasks],
  );

  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          Boolean(task.completedAt) ||
          task.status.toUpperCase() === "DONE",
      ),
    [tasks],
  );

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    setIsSaving(true);
    setTaskError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          projectId: projectId || null,
          dueAt: dueDate
            ? new Date(`${dueDate}T12:00:00`).toISOString()
            : null,
        }),
      });

      const data = (await response.json()) as {
        task?: Task;
        error?: string;
      };

      if (!response.ok || !data.task) {
        throw new Error(
          data.error ?? "Unable to create task.",
        );
      }

      setTasks((current) => [data.task!, ...current]);
      setTitle("");
      setDescription("");
      setPriority("NORMAL");
      setDueDate("");
      setProjectId("");
      setIsFormOpen(false);
    } catch (error) {
      setTaskError(
        error instanceof Error
          ? error.message
          : "Unable to create task.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openEditor(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditPriority(task.priority);
    setEditDueDate(dateInputValue(task.dueAt));
    setEditProjectId(task.projectId ?? "");
    setTaskError(null);
  }

  async function saveTaskChanges() {
    if (!editingTask || !editTitle.trim()) {
      return;
    }

    setIsSaving(true);
    setTaskError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingTask.id,
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          priority: editPriority,
          projectId: editProjectId || null,
          dueAt: editDueDate
            ? new Date(`${editDueDate}T12:00:00`).toISOString()
            : null,
        }),
      });

      const data = (await response.json()) as {
        task?: Task;
        error?: string;
      };

      if (!response.ok || !data.task) {
        throw new Error(
          data.error ?? "Unable to update task.",
        );
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === data.task!.id ? data.task! : task,
        ),
      );

      setEditingTask(null);
    } catch (error) {
      setTaskError(
        error instanceof Error
          ? error.message
          : "Unable to update task.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleComplete(task: Task) {
    const completed =
      !task.completedAt &&
      task.status.toUpperCase() !== "DONE";

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: task.id,
          completed,
        }),
      });

      const data = (await response.json()) as {
        task?: Task;
        error?: string;
      };

      if (!response.ok || !data.task) {
        throw new Error(
          data.error ?? "Unable to update task.",
        );
      }

      setTasks((current) =>
        current.map((item) =>
          item.id === data.task!.id ? data.task! : item,
        ),
      );
    } catch (error) {
      setTaskError(
        error instanceof Error
          ? error.message
          : "Unable to update task.",
      );
    }
  }

  async function deleteTask(task: Task) {
    const confirmed = window.confirm(
      `Delete "${task.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: task.id,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to delete task.",
        );
      }

      setTasks((current) =>
        current.filter((item) => item.id !== task.id),
      );

      if (editingTask?.id === task.id) {
        setEditingTask(null);
      }
    } catch (error) {
      setTaskError(
        error instanceof Error
          ? error.message
          : "Unable to delete task.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#F3EFE7] px-6 py-8 text-[#2C2C2C] lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#B08D57]">
              Execution
            </p>

            <h1 className="mt-3 text-4xl font-semibold text-[#1E3A34]">
              Tasks
            </h1>

            <p className="mt-2 text-[#6F776B]">
              One place for everything Jarvis needs you to finish.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void loadTasks()}
              disabled={isLoading}
              className="rounded-xl border border-[#C7BFB2] bg-[#F8F5EF] px-5 py-3 text-sm font-medium text-[#3F4742] transition hover:bg-white disabled:opacity-50"
            >
              {isLoading ? "Refreshing…" : "Refresh"}
            </button>

            <button
              type="button"
              onClick={() => setIsFormOpen((current) => !current)}
              className="rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2A5148]"
            >
              {isFormOpen ? "Cancel" : "New task"}
            </button>
          </div>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-5">
            <p className="text-3xl font-semibold text-[#1E3A34]">
              {openTasks.length}
            </p>
            <p className="mt-1 text-sm text-[#6F776B]">
              Open
            </p>
          </div>

          <div className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-5">
            <p className="text-3xl font-semibold text-[#1E3A34]">
              {
                openTasks.filter(
                  (task) => task.priority === "HIGH",
                ).length
              }
            </p>
            <p className="mt-1 text-sm text-[#6F776B]">
              High priority
            </p>
          </div>

          <div className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-5">
            <p className="text-3xl font-semibold text-[#1E3A34]">
              {completedTasks.length}
            </p>
            <p className="mt-1 text-sm text-[#6F776B]">
              Completed
            </p>
          </div>
        </section>

        {isFormOpen && (
          <form
            onSubmit={createTask}
            className="mb-6 rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6"
          >
            <h2 className="text-xl font-semibold text-[#1E3A34]">
              Create task
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-sm text-[#3F4742]">
                  Task
                </span>
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3 outline-none focus:border-[#B08D57]"
                />
              </label>

              <label>
                <span className="text-sm text-[#3F4742]">
                  Priority
                </span>
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3 outline-none focus:border-[#B08D57]"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="LOW">Low</option>
                </select>
              </label>

              <label>
                <span className="text-sm text-[#3F4742]">
                  Due date
                </span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3 outline-none focus:border-[#B08D57]"
                />
              </label>

              <label>
                <span className="text-sm text-[#3F4742]">
                  Project
                </span>
                <select
                  value={projectId}
                  onChange={(event) =>
                    setProjectId(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3 outline-none focus:border-[#B08D57]"
                >
                  <option value="">No project</option>
                  {projects
                    .filter((project) => project.status !== "DONE")
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="text-sm text-[#3F4742]">
                  Notes
                </span>
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-[#C7BFB2] bg-white px-4 py-3 outline-none focus:border-[#B08D57]"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="mt-5 rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Create task"}
            </button>
          </form>
        )}

        {taskError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {taskError}
          </div>
        )}

        <section className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
                Now
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#1E3A34]">
                Open tasks
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {isLoading ? (
              <p className="text-[#7A826E]">
                Loading tasks…
              </p>
            ) : openTasks.length === 0 ? (
              <div className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4 text-[#6F776B]">
                No open tasks.
              </div>
            ) : (
              openTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4"
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => void toggleComplete(task)}
                      className="mt-1 h-5 w-5 shrink-0 rounded border border-[#7A826E]"
                      aria-label={`Complete ${task.title}`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#2C2C2C]">
                            {task.title}
                          </p>

                          {task.sourceAccount && (
                            <p className="mt-1 text-xs text-[#7A826E]">
                              From email · {task.sourceAccount}
                            </p>
                          )}
                          {task.projectId && (
                            <p className="mt-1 text-xs font-medium text-[#7C5F33]">
                              Project ·{" "}
                              {projects.find(
                                (project) => project.id === task.projectId,
                              )?.name ?? "Project"}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {task.priority === "HIGH" && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                              High
                            </span>
                          )}

                          {formatDueDate(task.dueAt) && (
                            <span className="rounded-full border border-[#D7D0C5] bg-white px-2 py-1 text-xs text-[#6F776B]">
                              Due {formatDueDate(task.dueAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {task.description && (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6F776B]">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-4 flex gap-4">
                        <button
                          type="button"
                          onClick={() => openEditor(task)}
                          className="text-sm font-medium text-[#7C5F33]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteTask(task)}
                          className="text-sm text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6">
          <button
            type="button"
            onClick={() =>
              setShowCompleted((current) => !current)
            }
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A826E]">
                History
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#1E3A34]">
                Completed tasks
              </h2>
            </div>

            <span className="text-sm text-[#7A826E]">
              {showCompleted ? "Hide" : "Show"} ·{" "}
              {completedTasks.length}
            </span>
          </button>

          {showCompleted && (
            <div className="mt-5 space-y-3">
              {completedTasks.length === 0 ? (
                <p className="text-sm text-[#7A826E]">
                  No completed tasks yet.
                </p>
              ) : (
                completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[#E1DBD1] bg-[#F3EFE7] p-4"
                  >
                    <button
                      type="button"
                      onClick={() => void toggleComplete(task)}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#1E3A34] bg-[#1E3A34] text-xs text-white">
                        ✓
                      </span>

                      <span className="truncate text-sm text-[#6F776B] line-through">
                        {task.title}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteTask(task)}
                      className="shrink-0 text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>

      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
          onClick={() => setEditingTask(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-[#D7D0C5] bg-[#F8F5EF] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-[#1E3A34]">
                Edit task
              </h2>

              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-sm text-[#6F776B]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-sm">Task</span>
                <input
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Priority</span>
                <select
                  value={editPriority}
                  onChange={(event) =>
                    setEditPriority(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="LOW">Low</option>
                </select>
              </label>

              <label>
                <span className="text-sm">Due date</span>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(event) =>
                    setEditDueDate(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Project</span>
                <select
                  value={editProjectId}
                  onChange={(event) =>
                    setEditProjectId(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="text-sm">Notes</span>
                <textarea
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(event.target.value)
                  }
                  rows={5}
                  className="mt-2 w-full resize-none rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => void deleteTask(editingTask)}
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700"
              >
                Delete task
              </button>

              <button
                type="button"
                onClick={() => void saveTaskChanges()}
                disabled={isSaving || !editTitle.trim()}
                className="rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
