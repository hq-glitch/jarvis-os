import { getServerSession } from "next-auth";
import GoogleCalendarAuthButton from "../../../components/GoogleCalendarAuthButton";
import { authOptions } from "@/lib/auth";

export default async function CalendarConnectPage() {
  const session = await getServerSession(authOptions);
  const isConnected = Boolean(session?.accessToken);

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-400">
          Calendar Sources
        </p>

        <h1 className="mt-3 text-4xl font-semibold">
          Connect Google Calendar
        </h1>

        <p className="mt-3 max-w-2xl leading-7 text-slate-400">
          Connect your Google account so Jarvis can display the calendars
          available inside that account.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Google Calendar</h2>

              {isConnected ? (
                <>
                  <p className="mt-2 text-emerald-400">Connected</p>

                  <p className="mt-1 text-sm text-slate-400">
                    {session?.user?.email}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  No Google account is connected yet.
                </p>
              )}
            </div>

            <GoogleCalendarAuthButton isConnected={isConnected} />
          </div>
        </section>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm leading-6 text-slate-400">
            Jarvis currently requests read-only access. It cannot create,
            change, or delete Google Calendar events.
          </p>
        </div>
      </div>
    </main>
  );
}