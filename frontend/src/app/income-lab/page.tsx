"use client";

import { useEffect, useMemo, useState } from "react";

type IncomeOpportunity = {
  id: string;
  name: string;
  category: string | null;
  status: string;
  description: string | null;
  notes: string | null;
  sourceUrl: string | null;
  startupCost: number | null;
  monthlyPotential: number | null;
  timeToFirstDollar: string | null;
  effortScore: number | null;
  scalabilityScore: number | null;
  privacyRiskScore: number | null;
  jarvisScore: number | null;
  nextAction: string | null;
  actualIncome: number;
};

export default function IncomeLabPage() {
  const [opportunities, setOpportunities] = useState<IncomeOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [taskAddedId, setTaskAddedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newStatus, setNewStatus] = useState("RESEARCHING");
  const [newDescription, setNewDescription] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newNextAction, setNewNextAction] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] =
    useState<IncomeOpportunity | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("RESEARCHING");
  const [editDescription, setEditDescription] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSourceUrl, setEditSourceUrl] = useState("");
  const [editStartupCost, setEditStartupCost] = useState("");
  const [editMonthlyPotential, setEditMonthlyPotential] = useState("");
  const [editTimeToFirstDollar, setEditTimeToFirstDollar] = useState("");
  const [editEffortScore, setEditEffortScore] = useState("");
  const [editScalabilityScore, setEditScalabilityScore] = useState("");
  const [editPrivacyRiskScore, setEditPrivacyRiskScore] = useState("");
  const [editJarvisScore, setEditJarvisScore] = useState("");
  const [editNextAction, setEditNextAction] = useState("");
  const [editActualIncome, setEditActualIncome] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);


  async function loadIncomeLab() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/income-lab", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load Income Lab.");
      }

      const data = (await response.json()) as {
        opportunities: IncomeOpportunity[];
      };

      setOpportunities(data.opportunities ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Income Lab.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadIncomeLab();
  }, []);

  const summary = useMemo(() => {
    return {
      researching: opportunities.filter(
        (item) => item.status === "RESEARCHING",
      ).length,
      testing: opportunities.filter(
        (item) => item.status === "TESTING",
      ).length,
      active: opportunities.filter(
        (item) => item.status === "ACTIVE",
      ).length,
      monthlyIncome: opportunities.reduce(
        (total, item) => total + (item.actualIncome ?? 0),
        0,
      ),
    };
  }, [opportunities]);

  async function createOpportunity() {
    if (!newName.trim()) {
      setError("Opportunity name is required.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/income-lab", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
          category: newCategory || null,
          status: newStatus,
          description: newDescription || null,
          notes: newNotes || null,
          nextAction: newNextAction || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to add opportunity.");
      }

      setNewName("");
      setNewCategory("");
      setNewStatus("RESEARCHING");
      setNewDescription("");
      setNewNotes("");
      setNewNextAction("");
      setShowAddForm(false);

      await loadIncomeLab();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to add opportunity.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function openEditor(item: IncomeOpportunity) {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category ?? "");
    setEditStatus(item.status);
    setEditDescription(item.description ?? "");
    setEditNotes(item.notes ?? "");
    setEditSourceUrl(item.sourceUrl ?? "");
    setEditStartupCost(
      item.startupCost !== null ? String(item.startupCost) : "",
    );
    setEditMonthlyPotential(
      item.monthlyPotential !== null
        ? String(item.monthlyPotential)
        : "",
    );
    setEditTimeToFirstDollar(item.timeToFirstDollar ?? "");
    setEditEffortScore(
      item.effortScore !== null ? String(item.effortScore) : "",
    );
    setEditScalabilityScore(
      item.scalabilityScore !== null
        ? String(item.scalabilityScore)
        : "",
    );
    setEditPrivacyRiskScore(
      item.privacyRiskScore !== null
        ? String(item.privacyRiskScore)
        : "",
    );
    setEditJarvisScore(
      item.jarvisScore !== null ? String(item.jarvisScore) : "",
    );
    setEditNextAction(item.nextAction ?? "");
    setEditActualIncome(String(item.actualIncome ?? 0));
  }

  async function saveOpportunityChanges() {
    if (!editingItem || !editName.trim()) return;

    setIsSavingEdit(true);
    setError(null);

    try {
      const response = await fetch("/api/income-lab", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingItem.id,
          name: editName.trim(),
          category: editCategory.trim() || null,
          status: editStatus,
          description: editDescription.trim() || null,
          notes: editNotes.trim() || null,
          sourceUrl: editSourceUrl.trim() || null,
          startupCost: editStartupCost
            ? Number(editStartupCost)
            : null,
          monthlyPotential: editMonthlyPotential
            ? Number(editMonthlyPotential)
            : null,
          timeToFirstDollar:
            editTimeToFirstDollar.trim() || null,
          effortScore: editEffortScore
            ? Number(editEffortScore)
            : null,
          scalabilityScore: editScalabilityScore
            ? Number(editScalabilityScore)
            : null,
          privacyRiskScore: editPrivacyRiskScore
            ? Number(editPrivacyRiskScore)
            : null,
          jarvisScore: editJarvisScore
            ? Number(editJarvisScore)
            : null,
          nextAction: editNextAction.trim() || null,
          actualIncome: Number(editActualIncome || 0),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to update opportunity.");
      }

      setEditingItem(null);
      await loadIncomeLab();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update opportunity.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function saveNotes(item: IncomeOpportunity) {
    setSavingNoteId(item.id);
    setError(null);

    try {
      const response = await fetch("/api/income-lab", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          notes: notes[item.id] ?? item.notes ?? "",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save notes.");
      }

      await loadIncomeLab();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save notes.",
      );
    } finally {
      setSavingNoteId(null);
    }
  }

  async function moveToProjects(item: IncomeOpportunity) {
    setError(null);

    try {
      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          status: "ACTIVE",
          progress: 0,
          nextAction: item.nextAction,
          notes: notes[item.id] ?? item.notes ?? null,
          sourceType: "INCOME_LAB",
          sourceId: item.id,
        }),
      });

      if (!projectResponse.ok) {
        throw new Error("Unable to move opportunity to Projects.");
      }

      const updateResponse = await fetch("/api/income-lab", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          status: "PROMOTED",
        }),
      });

      if (!updateResponse.ok) {
        throw new Error(
          "Project created, but Income Lab status could not be updated.",
        );
      }

      await loadIncomeLab();
    } catch (moveError) {
      setError(
        moveError instanceof Error
          ? moveError.message
          : "Unable to move opportunity to Projects.",
      );
    }
  }

  async function addToTasks(item: IncomeOpportunity) {
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: item.nextAction
            ? `${item.name}: ${item.nextAction}`
            : `Research ${item.name}`,
          description: [
            `Income Lab opportunity: ${item.name}`,
            item.description,
            item.notes ? `Notes: ${item.notes}` : null,
          ]
            .filter(Boolean)
            .join("\n\n"),
          priority: "NORMAL",
          sourceType: "INCOME_LAB",
          sourceAccount: "income-lab",
          sourceMessageId: item.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to add task.");
      }

      setTaskAddedId(item.id);
    } catch (taskError) {
      setError(
        taskError instanceof Error
          ? taskError.message
          : "Unable to add task.",
      );
    }
  }

  const statusLabel = (status: string) => {
    if (status === "RESEARCHING") return "Researching";
    if (status === "TESTING") return "Testing";
    if (status === "ACTIVE") return "Active";
    if (status === "REJECTED") return "Rejected";
    return status;
  };

  const activeOpportunities = opportunities.filter(
    (item) => item.status !== "PROMOTED",
  );

  const archivedOpportunities = opportunities.filter(
    (item) => item.status === "PROMOTED",
  );

  return (
    <main className="min-h-screen bg-[#F3EFE7] px-6 py-8 text-[#2C2C2C] lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#B08D57]">
              Build income
            </p>

            <h1 className="mt-3 text-4xl font-semibold text-[#1E3A34]">
              Income Lab
            </h1>

            <p className="mt-2 max-w-2xl text-[#6F776B]">
              Research, test, rank, and grow income opportunities.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadIncomeLab()}
            disabled={isLoading}
            className="rounded-xl border border-[#B08D57] bg-[#F8F5EF] px-5 py-3 text-sm font-medium text-[#7C5F33] disabled:opacity-50"
          >
            {isLoading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Researching", summary.researching.toString()],
            ["Testing", summary.testing.toString()],
            ["Active", summary.active.toString()],
            [
              "Monthly income",
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(summary.monthlyIncome),
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B08D57]">
                {label}
              </p>

              <p className="mt-3 text-3xl font-semibold text-[#1E3A34]">
                {value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#1E3A34]">
                Opportunities
              </h2>

              <p className="mt-1 text-sm text-[#6F776B]">
                {activeOpportunities.length} active income ideas currently tracked.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-white"
            >
              Add opportunity
            </button>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {isLoading ? (
              <p className="text-[#6F776B]">Loading Income Lab…</p>
            ) : opportunities.length === 0 ? (
              <p className="rounded-xl bg-[#F3EFE7] p-5 text-[#6F776B]">
                No opportunities yet.
              </p>
            ) : (
              activeOpportunities.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#E1DBD1] bg-[#F3EFE7] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1E3A34]">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7A826E]">
                        {item.category ?? "Uncategorized"}
                      </p>
                    </div>

                    <span className="rounded-full border border-[#D7D0C5] bg-white px-3 py-1 text-xs font-semibold text-[#7C5F33]">
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-4 text-sm leading-6 text-[#5F675D]">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B08D57]">
                      Notes
                    </p>

                    <textarea
                      value={notes[item.id] ?? item.notes ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Research, ideas, concerns, results..."
                      rows={3}
                      className="mt-2 w-full resize-y rounded-xl border border-[#D7D0C5] bg-white px-4 py-3 text-sm text-[#3F4742]"
                    />

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void saveNotes(item)}
                        disabled={savingNoteId === item.id}
                        className="rounded-lg border border-[#B08D57] bg-white px-4 py-2 text-xs font-semibold text-[#7C5F33] disabled:opacity-50"
                      >
                        {savingNoteId === item.id
                          ? "Saving…"
                          : "Save notes"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void moveToProjects(item)}
                        className="rounded-lg bg-[#B08D57] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Move to Projects
                      </button>

                      <button
                        type="button"
                        onClick={() => void addToTasks(item)}
                        className="rounded-lg bg-[#1E3A34] px-4 py-2 text-xs font-semibold text-white"
                      >
                        {taskAddedId === item.id
                          ? "Added to Tasks ✓"
                          : "Add to task list"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-white/70 p-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#7A826E]">
                        Potential
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1E3A34]">
                        {item.monthlyPotential !== null
                          ? `$${item.monthlyPotential.toLocaleString()}/mo`
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 p-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#7A826E]">
                        Actual
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1E3A34]">
                        ${item.actualIncome.toLocaleString()}/mo
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 p-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#7A826E]">
                        Jarvis score
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1E3A34]">
                        {item.jarvisScore ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 p-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#7A826E]">
                        First dollar
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1E3A34]">
                        {item.timeToFirstDollar ?? "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditor(item)}
                    className="mt-4 text-sm font-semibold text-[#7C5F33]"
                  >
                    Edit opportunity
                  </button>

                  {item.nextAction && (
                    <div className="mt-4 rounded-xl border border-[#D7D0C5] bg-white/70 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B08D57]">
                        Next action
                      </p>

                      <p className="mt-2 text-sm text-[#3F4742]">
                        {item.nextAction}
                      </p>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        {archivedOpportunities.length > 0 && (
          <section className="mt-6 rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-6">
            <details>
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
                      Archive
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[#1E3A34]">
                      Promoted to Projects
                    </h2>
                  </div>

                  <span className="rounded-full border border-[#D7D0C5] bg-white px-3 py-1 text-xs font-semibold text-[#7C5F33]">
                    {archivedOpportunities.length}
                  </span>
                </div>
              </summary>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {archivedOpportunities.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-[#E1DBD1] bg-[#F3EFE7] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#1E3A34]">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7A826E]">
                          {item.category ?? "Uncategorized"}
                        </p>
                      </div>

                      <span className="rounded-full border border-[#D7D0C5] bg-white px-3 py-1 text-xs font-semibold text-[#7C5F33]">
                        In Projects
                      </span>
                    </div>

                    {item.description && (
                      <p className="mt-4 text-sm leading-6 text-[#5F675D]">
                        {item.description}
                      </p>
                    )}

                    {item.notes && (
                      <div className="mt-4 rounded-xl border border-[#D7D0C5] bg-white/70 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B08D57]">
                          Notes
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[#3F4742]">
                          {item.notes}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </details>
          </section>
        )}
      </div>

      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/25 px-4 py-8 backdrop-blur-[2px]"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl border border-[#D7D0C5] bg-[#F8F5EF] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
                  Income Lab
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1E3A34]">
                  Edit opportunity
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-sm text-[#6F776B]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-sm">Name</span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Category</span>
                <input
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Status</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                >
                  <option value="RESEARCHING">Researching</option>
                  <option value="TESTING">Testing</option>
                  <option value="ACTIVE">Active</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PROMOTED">Promoted</option>
                </select>
              </label>

              <label>
                <span className="text-sm">Startup cost $</span>
                <input
                  type="number"
                  step="0.01"
                  value={editStartupCost}
                  onChange={(e) => setEditStartupCost(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Monthly potential $</span>
                <input
                  type="number"
                  step="0.01"
                  value={editMonthlyPotential}
                  onChange={(e) =>
                    setEditMonthlyPotential(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Actual monthly income $</span>
                <input
                  type="number"
                  step="0.01"
                  value={editActualIncome}
                  onChange={(e) => setEditActualIncome(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Time to first dollar</span>
                <input
                  value={editTimeToFirstDollar}
                  onChange={(e) =>
                    setEditTimeToFirstDollar(e.target.value)
                  }
                  placeholder="Example: 1–2 weeks"
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Effort score</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editEffortScore}
                  onChange={(e) => setEditEffortScore(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Scalability score</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editScalabilityScore}
                  onChange={(e) =>
                    setEditScalabilityScore(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Privacy risk score</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editPrivacyRiskScore}
                  onChange={(e) =>
                    setEditPrivacyRiskScore(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Jarvis score</span>
                <input
                  type="number"
                  step="0.1"
                  value={editJarvisScore}
                  onChange={(e) => setEditJarvisScore(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm">Source URL</span>
                <input
                  value={editSourceUrl}
                  onChange={(e) => setEditSourceUrl(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm">Description</span>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm">Next action</span>
                <input
                  value={editNextAction}
                  onChange={(e) => setEditNextAction(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm">Notes</span>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void saveOpportunityChanges()}
              disabled={isSavingEdit || !editName.trim()}
              className="mt-6 w-full rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSavingEdit ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-[#D7D0C5] bg-[#F8F5EF] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
                  Income Lab
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-[#1E3A34]">
                  Add opportunity
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-sm text-[#6F776B]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-sm">Name</span>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Opportunity name"
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Category</span>
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="Affiliate, UGC, digital products..."
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label>
                <span className="text-sm">Status</span>
                <select
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                >
                  <option value="RESEARCHING">Researching</option>
                  <option value="TESTING">Testing</option>
                  <option value="ACTIVE">Active</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="text-sm">Description</span>
                <textarea
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  rows={3}
                  placeholder="What is this opportunity?"
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm">Notes</span>
                <textarea
                  value={newNotes}
                  onChange={(event) => setNewNotes(event.target.value)}
                  rows={3}
                  placeholder="Research, concerns, ideas, links..."
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm">Next action</span>
                <input
                  value={newNextAction}
                  onChange={(event) => setNewNextAction(event.target.value)}
                  placeholder="What should happen next?"
                  className="mt-2 w-full rounded-xl border border-[#C7BFB2] bg-white px-4 py-3"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void createOpportunity()}
              disabled={isCreating}
              className="mt-6 w-full rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isCreating ? "Adding…" : "Add to Income Lab"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
