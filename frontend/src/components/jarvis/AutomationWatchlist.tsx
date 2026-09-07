"use client";

import { useCallback, useEffect, useState } from "react";

type AutomationAction = {
  id: string;
  level: "AUTO" | "SUGGEST" | "APPROVAL_REQUIRED";
  type:
    | "OVERDUE_TASK"
    | "UPCOMING_DEADLINE"
    | "STALE_TASK"
    | "HIGH_PRIORITY_TASK";
  title: string;
  description: string;
  taskId?: string;
  score: number;
};

type AutomationDecision = {
  action: AutomationAction;
  level: "AUTO" | "SUGGEST" | "APPROVAL_REQUIRED";
  canExecuteAutomatically: boolean;
  requiresApproval: boolean;
  reason: string;
};

type AutomationPreview = {
  openTaskCount: number;
  proposedActionCount: number;
  actions: AutomationDecision[];
};

type ActionType = "COMPLETE" | "SNOOZE" | "DISMISS";

function actionLabel(type: AutomationAction["type"]) {
  switch (type) {
    case "OVERDUE_TASK":
      return "Overdue";
    case "UPCOMING_DEADLINE":
      return "Deadline";
    case "STALE_TASK":
      return "Stale";
    case "HIGH_PRIORITY_TASK":
      return "Priority";
  }
}

export default function AutomationWatchlist() {
  const [preview, setPreview] =
    useState<AutomationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/jarvis/automation-preview",
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Automation preview failed.");
      }

      const data =
        (await response.json()) as AutomationPreview;

      setPreview(data);
    } catch (error) {
      console.error(
        "Unable to load Jarvis Watchlist:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPreview();

    function handleCaptureComplete() {
      void loadPreview();
    }

    window.addEventListener(
      "jarvis:capture-complete",
      handleCaptureComplete,
    );

    return () => {
      window.removeEventListener(
        "jarvis:capture-complete",
        handleCaptureComplete,
      );
    };
  }, [loadPreview]);

  async function performAction(
    decision: AutomationDecision,
    actionType: ActionType,
  ) {
    const taskId = decision.action.taskId;

    if (!taskId) {
      setActionError(
        "Jarvis cannot act on this suggestion because it has no task.",
      );
      return;
    }

    setActingOn(decision.action.id);
    setActionError(null);

    try {
      const response = await fetch(
        "/api/jarvis/automation-action",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: actionType,
            actionId: decision.action.id,
            automationType: decision.action.type,
            taskId,
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Jarvis could not perform that action.",
        );
      }

      await loadPreview();
    } catch (error) {
      console.error(
        "Jarvis automation action failed:",
        error,
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Jarvis could not perform that action.",
      );
    } finally {
      setActingOn(null);
    }
  }

  async function snoozeTask(decision: AutomationDecision) {
    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + 1);
    snoozedUntil.setHours(9, 0, 0, 0);

    const taskId = decision.action.taskId;

    if (!taskId) {
      setActionError(
        "Jarvis cannot snooze this suggestion because it has no task.",
      );
      return;
    }

    setActingOn(decision.action.id);
    setActionError(null);

    try {
      const response = await fetch(
        "/api/jarvis/automation-action",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "SNOOZE",
            actionId: decision.action.id,
            automationType: decision.action.type,
            taskId,
            snoozedUntil: snoozedUntil.toISOString(),
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Jarvis could not snooze that task.",
        );
      }

      await loadPreview();
    } catch (error) {
      console.error(
        "Jarvis snooze action failed:",
        error,
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Jarvis could not snooze that task.",
      );
    } finally {
      setActingOn(null);
    }
  }

  return (
    <section className="rounded-2xl border border-[#D8D0C3] bg-white/70 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A7A45]">
            Jarvis Watchlist
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1E3A34]">
            Things worth your attention.
          </h2>

          <p className="mt-1 text-sm text-[#6F776B]">
            Jarvis is watching your open work for deadlines,
            stale items, and priority changes.
          </p>
        </div>

        {!loading && preview && (
          <div className="rounded-full bg-[#1E3A34] px-3 py-1 text-xs font-semibold text-white">
            {preview.proposedActionCount}
          </div>
        )}
      </div>

      <div className="mt-4">
        {actionError && (
          <div className="mb-3 rounded-xl border border-[#C9AFAF] bg-[#FBF4F4] px-4 py-3">
            <p className="text-sm text-[#7A4545]">
              {actionError}
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-[#6F776B]">
            Jarvis is checking...
          </p>
        ) : !preview ||
          preview.actions.length === 0 ? (
          <div className="rounded-xl border border-[#D8D0C3] bg-[#F8F5EF] p-4">
            <p className="text-sm font-medium text-[#406A5E]">
              Nothing needs intervention right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {preview.actions.map((decision) => {
              const action = decision.action;
              const isActing = actingOn === action.id;

              return (
                <div
                  key={action.id}
                  className="rounded-xl border border-[#D8D0C3] bg-[#F8F5EF] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#E9E0D0] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#725B35]">
                          {actionLabel(action.type)}
                        </span>

                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6F776B]">
                          {decision.requiresApproval
                            ? "Approval required"
                            : decision.canExecuteAutomatically
                              ? "Automatic"
                              : "Suggestion"}
                        </span>
                      </div>

                      <p className="mt-2 font-semibold text-[#1E3A34]">
                        {action.title}
                      </p>

                      <p className="mt-1 text-sm text-[#6F776B]">
                        {action.description}
                      </p>

                      <div className="mt-3 rounded-lg border border-[#E3DCCD] bg-white/70 px-3 py-2">
                        <p className="text-xs text-[#6F776B]">
                          <span className="font-semibold text-[#1E3A34]">
                            Jarvis policy:
                          </span>{" "}
                          {decision.reason}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() =>
                            void performAction(
                              decision,
                              "COMPLETE",
                            )
                          }
                          className="rounded-lg bg-[#1E3A34] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#294D44] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isActing
                            ? "Working..."
                            : "Complete"}
                        </button>

                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() =>
                            void snoozeTask(decision)
                          }
                          className="rounded-lg border border-[#B8AA95] bg-white px-3 py-2 text-xs font-semibold text-[#725B35] transition hover:bg-[#F0EBDD] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Snooze 1 day
                        </button>

                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() =>
                            void performAction(
                              decision,
                              "DISMISS",
                            )
                          }
                          className="rounded-lg border border-[#D8D0C3] px-3 py-2 text-xs font-semibold text-[#6F776B] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>

                    <div className="shrink-0 text-xs font-semibold text-[#9A7A45]">
                      {action.score}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
