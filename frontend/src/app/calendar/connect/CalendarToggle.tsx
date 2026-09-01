"use client";

import { useState } from "react";

interface CalendarToggleProps {
  calendarId: string;
  initialEnabled: boolean;
}

export default function CalendarToggle({
  calendarId,
  initialEnabled,
}: CalendarToggleProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isSaving, setIsSaving] = useState(false);

  async function handleToggle() {
    const nextEnabled = !isEnabled;

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/calendars/${calendarId}/enabled`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isEnabled: nextEnabled,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to update calendar.");
      }

      setIsEnabled(nextEnabled);
    } catch (error) {
      console.error("Unable to update calendar.", error);
      alert("Jarvis could not update this calendar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isEnabled}
      aria-label={isEnabled ? "Disable calendar" : "Enable calendar"}
      disabled={isSaving}
      onClick={handleToggle}
      className={`relative ml-auto inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        isEnabled ? "bg-[#1E3A34]" : "bg-[#C7BFB2]"
      } ${isSaving ? "cursor-wait opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition ${
          isEnabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

