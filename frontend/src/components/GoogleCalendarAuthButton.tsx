"use client";

import { signIn, signOut } from "next-auth/react";

type GoogleCalendarAuthButtonProps = {
  isConnected: boolean;
};

export default function GoogleCalendarAuthButton({
  isConnected,
}: GoogleCalendarAuthButtonProps) {
  if (isConnected) {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/calendar/connect" })}
        className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
      >
        Disconnect Google
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        signIn("google", {
          callbackUrl: "/calendar/connect",
        })
      }
      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
    >
      Connect Google Calendar
    </button>
  );
}