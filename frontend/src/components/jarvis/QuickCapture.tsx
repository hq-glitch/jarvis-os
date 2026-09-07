"use client";

import { FormEvent, useState } from "react";

type CaptureResult = {
  captured?: boolean;
  intent?: "TASK" | "INCOME_LAB";
  alreadyExists?: boolean;
  needsClarification?: boolean;
  error?: string;

  task?: {
    title: string;
    area?: {
      name: string;
    } | null;
  };

  opportunity?: {
    name: string;
  };
};

export default function QuickCapture() {
  const [text, setText] = useState("");
  const [contextText, setContextText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] =
    useState<CaptureResult | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmed = text.trim();

    if (!trimmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/jarvis/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmed,
          contextText: contextText.trim() || null,
          sourceMessageId: crypto.randomUUID(),
          sourceAccount: "mission-control",
        }),
      });

      const data = (await response.json()) as CaptureResult;

      setResult(data);

      if (response.ok && data.captured) {
        setText("");
        setContextText("");

        window.dispatchEvent(
          new CustomEvent("jarvis:capture-complete", {
            detail: data,
          }),
        );
      }
    } catch (error) {
      console.error("Quick capture failed:", error);

      setResult({
        captured: false,
        error: "Jarvis could not save that capture.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const successMessage =
    result?.captured && result.intent === "TASK"
      ? `Captured task: ${result.task?.title ?? "Task"}${
          result.task?.area?.name
            ? ` → ${result.task.area.name}`
            : ""
        }`
      : result?.captured &&
          result.intent === "INCOME_LAB"
        ? `Added to Income Lab: ${
            result.opportunity?.name ?? "Opportunity"
          }`
        : null;

  return (
    <section className="rounded-2xl border border-[#D8D0C3] bg-white/70 p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A7A45]">
          Quick Capture
        </p>

        <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[#1E3A34]">
          Tell Jarvis what to remember.
        </h2>

        <p className="mt-1 text-sm text-[#6F776B]">
          Try “come back to fixing the fence later” or
          “add Example.com to Income Lab.”
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-3"
      >
        <div className="flex gap-3">
          <input
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setResult(null);
            }}
            placeholder="What should Jarvis capture?"
            className="min-w-0 flex-1 rounded-xl border border-[#D8D0C3] bg-[#F8F5EF] px-4 py-3 text-sm text-[#2C2C2C] outline-none transition focus:border-[#B08D57]"
          />

          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="shrink-0 rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#284C44] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Capturing..." : "Capture"}
          </button>
        </div>

        {result?.needsClarification && (
          <div className="rounded-xl border border-[#D8D0C3] bg-[#F8F5EF] p-4">
            <p className="text-sm font-medium text-[#1E3A34]">
              Jarvis needs the missing context.
            </p>

            <input
              value={contextText}
              onChange={(event) =>
                setContextText(event.target.value)
              }
              placeholder="What does “this” refer to?"
              className="mt-3 w-full rounded-lg border border-[#D8D0C3] bg-white px-3 py-2 text-sm outline-none focus:border-[#B08D57]"
            />
          </div>
        )}

        {successMessage && (
          <p className="text-sm font-medium text-[#406A5E]">
            ✓ {successMessage}
          </p>
        )}

        {result?.error &&
          !result.needsClarification && (
            <p className="text-sm font-medium text-[#8A4C42]">
              {result.error}
            </p>
          )}
      </form>
    </section>
  );
}
