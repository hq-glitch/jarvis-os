import { listConnectedIntegrations } from "@/services/integration-service";
import CalendarToggle from "./CalendarToggle";

interface CalendarConnectPageProps {
  searchParams: Promise<{
    connected?: string;
    calendars?: string;
    error?: string;
  }>;
}

function getErrorMessage(error?: string): string | null {
  switch (error) {
    case "google_denied":
      return "Google access was not approved.";

    case "invalid_callback":
      return "Google returned an invalid connection response.";

    case "google_connection_failed":
      return "Jarvis could not complete the Google connection.";

    case "apple_missing_credentials":
      return "Enter your Apple Account email and app-specific password.";

    case "apple_connection_failed":
      return "Jarvis could not connect to iCloud. Check your Apple Account email and app-specific password.";

    default:
      return null;
  }
}

function getProviderLabel(provider: string): string {
  switch (provider) {
    case "APPLE":
      return "iCloud";

    case "MICROSOFT":
      return "Microsoft";

    case "GOOGLE":
      return "Google";

    default:
      return provider;
  }
}

export default async function CalendarConnectPage({
  searchParams,
}: CalendarConnectPageProps) {
  const params = await searchParams;
  const integrations = await listConnectedIntegrations();
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header>
          <h1 className="font-display text-5xl font-semibold text-[#1E3A34]">
            Connected calendars
          </h1>

          <p className="mt-2 text-[#6F776B]">
            Connect your Google and iCloud accounts without replacing
            existing connections.
          </p>
        </header>

        {params.connected === "google" && (
          <div className="mt-6 rounded-lg border border-[#7A826E] bg-[#E4E8DE] p-4 text-[#1E3A34]">
            Google connected successfully. Imported{" "}
            {params.calendars ?? "0"} calendars.
          </div>
        )}

        {params.connected === "apple" && (
          <div className="mt-6 rounded-lg border border-[#7A826E] bg-[#E4E8DE] p-4 text-[#1E3A34]">
            iCloud connected successfully. Imported{" "}
            {params.calendars ?? "0"} calendars.
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-lg border border-[#B56B5D] bg-[#F3E4DF] p-4 text-[#8A493E]">
            {errorMessage}
          </div>
        )}

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-7 shadow-[0_12px_35px_rgba(30,58,52,0.06)]">
            <div className="flex h-full flex-col">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
                  Google Calendar
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Connect a Google account
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6F776B]">
                  Import calendars from a personal Gmail or an approved
                  Google Workspace account.
                </p>
              </div>

              <a
                href="/api/integrations/google/connect"
                className="mt-6 inline-flex w-fit rounded-xl bg-[#1E3A34] px-5 py-3 font-medium text-[#F8F5EF] transition hover:bg-[#2A5148]"
              >
                Connect Google
              </a>
            </div>
          </article>

          <article className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-7 shadow-[0_12px_35px_rgba(30,58,52,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08D57]">
              Apple Calendar
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Connect iCloud
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#6F776B]">
              Use your Apple Account email and an app-specific password.
              Do not use your normal Apple password.
            </p>

            <form
              action="/api/integrations/apple/connect"
              method="post"
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="appleUsername"
                  className="block text-sm font-medium text-[#3F4742]"
                >
                  Apple Account email
                </label>

                <input
                  id="appleUsername"
                  name="appleUsername"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="name@icloud.com"
                  className="mt-2 w-full rounded-lg border border-[#C7BFB2] bg-[#F8F5EF] px-3 py-2 text-[#2C2C2C] outline-none transition placeholder:text-[#5F665C] focus:border-[#B08D57]"
                />
              </div>

              <div>
                <label
                  htmlFor="appSpecificPassword"
                  className="block text-sm font-medium text-[#3F4742]"
                >
                  App-specific password
                </label>

                <input
                  id="appSpecificPassword"
                  name="appSpecificPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="mt-2 w-full rounded-lg border border-[#C7BFB2] bg-[#F8F5EF] px-3 py-2 text-[#2C2C2C] outline-none transition placeholder:text-[#5F665C] focus:border-[#B08D57]"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-[#1E3A34] px-5 py-3 font-medium text-[#F8F5EF] transition hover:bg-[#2A5148]"
              >
                Connect iCloud
              </button>
            </form>
          </article>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-[#1E3A34]">
            Connected accounts
          </h2>

          <div className="mt-4 space-y-4">
            {integrations.length === 0 ? (
              <div className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-7 shadow-[0_12px_35px_rgba(30,58,52,0.06)]">
                <h3 className="font-medium">
                  No accounts connected
                </h3>

                <p className="mt-2 text-sm text-[#6F776B]">
                  Connect Google or iCloud to begin importing calendars.
                </p>
              </div>
            ) : (
              integrations.map((integration) => (
                <article
                  key={integration.id}
                  className="rounded-2xl border border-[#D7D0C5] bg-[#F8F5EF] p-7 shadow-[0_12px_35px_rgba(30,58,52,0.06)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {integration.displayName ??
                            integration.email ??
                            `${getProviderLabel(
                              integration.provider,
                            )} account`}
                        </h3>

                        <span className="rounded-full border border-[#C7BFB2] px-2 py-0.5 text-xs text-[#6F776B]">
                          {getProviderLabel(integration.provider)}
                        </span>
                      </div>

                      {integration.email && (
                        <p className="mt-1 text-sm text-[#6F776B]">
                          {integration.email}
                        </p>
                      )}
                    </div>

                    <span className="rounded-full border border-[#C7BFB2] px-3 py-1 text-xs">
                      {integration.status}
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium">
                      {integration.calendars.length}{" "}
                      {integration.calendars.length === 1
                        ? "calendar"
                        : "calendars"}
                    </p>

                    {integration.calendars.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {integration.calendars.map((calendar) => {
                          const calendarColor =
                            calendar.customColor ??
                            calendar.providerColor ??
                            "#64748b";

                          return (
                            <li
                              key={calendar.id}
                              className="flex items-center gap-3 text-sm text-[#3F4742]"
                            >
                              <span
                                className="h-3 w-3 shrink-0 rounded-full border border-[#B08D57]/60"
                                style={{
                                  backgroundColor: calendarColor,
                                }}
                              />

                              <span>{calendar.name}</span>

                              {calendar.isPrimary && (
                                <span className="text-xs text-[#7A826E]">
                                  Primary
                                </span>
                              )}

                              {!calendar.isEnabled && (
                                <span className="text-xs text-[#7A826E]">
                                  Disabled
                                </span>
                              )}

                              <CalendarToggle
                                calendarId={calendar.id}
                                initialEnabled={calendar.isEnabled}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-[#7A826E]">
                        No calendars have been imported for this
                        account.
                      </p>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}