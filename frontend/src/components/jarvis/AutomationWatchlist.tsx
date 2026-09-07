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

type AutomationPreview = {
  openTaskCount: number;
  proposedActionCount: number;
  actions: AutomationAction[];
};

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
            {preview.actions.map((action) => (
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
                        {action.level === "APPROVAL_REQUIRED"
                          ? "Approval required"
                          : action.level === "AUTO"
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
                  </div>

                  <div className="shrink-0 text-xs font-semibold text-[#9A7A45]">
                    {action.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
