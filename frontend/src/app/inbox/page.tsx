"use client";

import { useEffect, useMemo, useState } from "react";

type GmailMessage = {
  externalId: string;
  threadId: string | null;
  subject: string;
  from: string | null;
  to: string | null;
  date: string | null;
  snippet: string | null;
  isUnread: boolean;
  labels: string[];
};

type GmailAccount = {
  integrationId: string;
  email: string | null;
  displayName: string | null;
  accountColor: string | null;
  messages: GmailMessage[];
};

type GmailMessageDetail = GmailMessage & {
  cc: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
};

type OpenMessage = {
  accountEmail: string;
  accountColor: string | null;
  message: GmailMessageDetail;
};

type ConnectionError = {
  integrationId: string;
  email: string | null;
  error: string;
};

type TriageCategory =
  | "Urgent"
  | "Action Needed"
  | "Informational"
  | "Low Priority";

type InboxMessage = GmailMessage & {
  accountEmail: string;
  accountName: string;
  accountColor: string | null;
  triage: TriageCategory;
};

function decodeHtml(value: string | null) {
  if (!value) {
    return "";
  }

  if (typeof window === "undefined") {
    return value;
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function formatMessageDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function normalizeColor(value: string | null) {
  const match = value?.match(/^#([0-9a-f]{6})/i);

  return match ? `#${match[1]}` : "#7A826E";
}

function classifyMessage(message: GmailMessage): TriageCategory {
  const text = [
    message.subject,
    message.from,
    message.snippet,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const urgentTerms = [
    "urgent",
    "immediately",
    "asap",
    "past due",
    "overdue",
    "final notice",
    "action required",
    "deadline today",
    "due today",
    "security alert",
    "suspicious",
    "failed payment",
    "payment failed",
  ];

  const actionTerms = [
    "please complete",
    "please review",
    "please respond",
    "please reply",
    "reminder",
    "due",
    "deadline",
    "sign",
    "submit",
    "confirm",
    "approval",
    "register",
    "application",
    "appointment",
    "invoice",
    "payment",
    "verify",
  ];

  const lowPriorityTerms = [
    "unsubscribe",
    "sale",
    "deal",
    "discount",
    "promo",
    "promotion",
    "newsletter",
    "shop now",
    "limited time",
    "save %",
    "rewards",
    "points",
    "new arrivals",
  ];

  if (urgentTerms.some((term) => text.includes(term))) {
    return "Urgent";
  }

  if (actionTerms.some((term) => text.includes(term))) {
    return "Action Needed";
  }

  if (
    lowPriorityTerms.some((term) => text.includes(term)) ||
    message.labels.includes("CATEGORY_PROMOTIONS")
  ) {
    return "Low Priority";
  }

  return "Informational";
}

const triageStyles: Record<TriageCategory, string> = {
  Urgent:
    "border-red-200 bg-red-50 text-red-700",
  "Action Needed":
    "border-amber-200 bg-amber-50 text-amber-700",
  Informational:
    "border-[#C9D5CC] bg-[#EEF3EF] text-[#4F6656]",
  "Low Priority":
    "border-[#DDD8D0] bg-[#F4F1EC] text-[#7A756D]",
};

const triageOrder: Record<TriageCategory, number> = {
  Urgent: 0,
  "Action Needed": 1,
  Informational: 2,
  "Low Priority": 3,
};

export default function InboxPage() {
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [connectionErrors, setConnectionErrors] = useState<ConnectionError[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedTriage, setSelectedTriage] = useState<
    TriageCategory | "all"
  >("all");
  const [openMessage, setOpenMessage] = useState<OpenMessage | null>(null);
  const [isOpeningMessage, setIsOpeningMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [taskMessage, setTaskMessage] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false);
  const [messageActionStatus, setMessageActionStatus] =
    useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const [messageCache, setMessageCache] = useState<
    Record<string, GmailMessageDetail>
  >({});

  function getMessageCacheKey(message: InboxMessage) {
    const account = accounts.find(
      (item) => item.email === message.accountEmail,
    );

    return account
      ? `${account.integrationId}:${message.externalId}`
      : null;
  }

  async function fetchMessageDetail(
    message: InboxMessage,
  ): Promise<GmailMessageDetail | null> {
    const account = accounts.find(
      (item) => item.email === message.accountEmail,
    );

    if (!account) {
      return null;
    }

    const cacheKey = `${account.integrationId}:${message.externalId}`;
    const cached = messageCache[cacheKey];

    if (cached) {
      return cached;
    }

    const response = await fetch(
      `/api/email/${encodeURIComponent(account.integrationId)}/${encodeURIComponent(message.externalId)}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Unable to open this email.");
    }

    const data = (await response.json()) as {
      message: GmailMessageDetail;
    };

    setMessageCache((current) => ({
      ...current,
      [cacheKey]: data.message,
    }));

    return data.message;
  }

  async function prefetchEmail(message: InboxMessage) {
    const cacheKey = getMessageCacheKey(message);

    if (!cacheKey || messageCache[cacheKey]) {
      return;
    }

    try {
      await fetchMessageDetail(message);
    } catch {
      // Prefetch failures should not interrupt the inbox.
    }
  }

  async function openEmail(message: InboxMessage) {
    const cacheKey = getMessageCacheKey(message);

    if (cacheKey && messageCache[cacheKey]) {
      setOpenMessage({
        accountEmail: message.accountEmail,
        accountColor: message.accountColor,
        message: messageCache[cacheKey],
      });
      return;
    }

    setIsOpeningMessage(true);
    setMessageError(null);

    try {
      const detail = await fetchMessageDetail(message);

      if (!detail) {
        return;
      }

      setOpenMessage({
        accountEmail: message.accountEmail,
        accountColor: message.accountColor,
        message: detail,
      });
    } catch (error) {
      setMessageError(
        error instanceof Error ? error.message : "Unable to open this email.",
      );
    } finally {
      setIsOpeningMessage(false);
    }
  }

  function extractEmailAddress(value: string | null) {
    if (!value) {
      return "";
    }

    const match = value.match(/<([^>]+)>/);

    return (match?.[1] ?? value).trim();
  }

  async function saveReplyDraft() {
    if (!openMessage || !replyBody.trim()) {
      return;
    }

    const account = accounts.find(
      (item) => item.email === openMessage.accountEmail,
    );

    if (!account) {
      return;
    }

    setIsSavingDraft(true);
    setDraftStatus(null);

    try {
      const to = extractEmailAddress(
        openMessage.message.from,
      );

      const subject = /^re:/i.test(
        openMessage.message.subject,
      )
        ? openMessage.message.subject
        : `Re: ${openMessage.message.subject}`;

      const response = await fetch(
        `/api/email/${encodeURIComponent(account.integrationId)}/${encodeURIComponent(openMessage.message.externalId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create_draft",
            to,
            subject,
            body: replyBody,
            threadId: openMessage.message.threadId,
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to save Gmail draft.",
        );
      }

      setDraftStatus("Reply saved to Gmail Drafts.");
      setIsReplying(false);
      setReplyBody("");
    } catch (error) {
      setDraftStatus(
        error instanceof Error
          ? error.message
          : "Unable to save Gmail draft.",
      );
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function updateReadState() {
    if (!openMessage) {
      return;
    }

    const account = accounts.find(
      (item) => item.email === openMessage.accountEmail,
    );

    if (!account) {
      return;
    }

    setIsUpdatingMessage(true);
    setMessageActionStatus(null);

    try {
      const action = openMessage.message.isUnread
        ? "mark_read"
        : "mark_unread";

      const response = await fetch(
        `/api/email/${encodeURIComponent(account.integrationId)}/${encodeURIComponent(openMessage.message.externalId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
        isUnread?: boolean;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to update message.",
        );
      }

      const isUnread = data.isUnread ?? false;

      setOpenMessage((current) =>
        current
          ? {
              ...current,
              message: {
                ...current.message,
                isUnread,
              },
            }
          : current,
      );

      setAccounts((currentAccounts) =>
        currentAccounts.map((accountItem) =>
          accountItem.integrationId === account.integrationId
            ? {
                ...accountItem,
                messages: accountItem.messages.map((message) =>
                  message.externalId === openMessage.message.externalId
                    ? {
                        ...message,
                        isUnread,
                      }
                    : message,
                ),
              }
            : accountItem,
        ),
      );

      setMessageActionStatus(
        isUnread ? "Marked unread." : "Marked read.",
      );
    } catch (error) {
      setMessageActionStatus(
        error instanceof Error
          ? error.message
          : "Unable to update message.",
      );
    } finally {
      setIsUpdatingMessage(false);
    }
  }

  async function archiveOpenMessage() {
    if (!openMessage) {
      return;
    }

    const account = accounts.find(
      (item) => item.email === openMessage.accountEmail,
    );

    if (!account) {
      return;
    }

    const confirmed = window.confirm(
      "Archive this email from the inbox?",
    );

    if (!confirmed) {
      return;
    }

    setIsUpdatingMessage(true);
    setMessageActionStatus(null);

    try {
      const response = await fetch(
        `/api/email/${encodeURIComponent(account.integrationId)}/${encodeURIComponent(openMessage.message.externalId)}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to archive message.",
        );
      }

      setAccounts((currentAccounts) =>
        currentAccounts.map((accountItem) =>
          accountItem.integrationId === account.integrationId
            ? {
                ...accountItem,
                messages: accountItem.messages.filter(
                  (message) =>
                    message.externalId !==
                    openMessage.message.externalId,
                ),
              }
            : accountItem,
        ),
      );

      setOpenMessage(null);
    } catch (error) {
      setMessageActionStatus(
        error instanceof Error
          ? error.message
          : "Unable to archive message.",
      );
    } finally {
      setIsUpdatingMessage(false);
    }
  }

  async function createTaskFromOpenMessage() {
    if (!openMessage) {
      return;
    }

    setIsCreatingTask(true);
    setTaskMessage(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: decodeHtml(openMessage.message.subject),
          description:
            openMessage.message.bodyText ??
            openMessage.message.snippet ??
            null,
          priority:
            openMessage.message.labels.includes("IMPORTANT")
              ? "HIGH"
              : "NORMAL",
          sourceType: "EMAIL",
          sourceAccount: openMessage.accountEmail,
          sourceMessageId: openMessage.message.externalId,
          sourceThreadId: openMessage.message.threadId,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create task.");
      }

      const data = (await response.json()) as {
        alreadyExists: boolean;
      };

      setTaskMessage(
        data.alreadyExists
          ? "This email is already a Jarvis task."
          : "Task added to Jarvis.",
      );
    } catch (error) {
      setTaskMessage(
        error instanceof Error ? error.message : "Unable to create task.",
      );
    } finally {
      setIsCreatingTask(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInbox() {
      try {
        const response = await fetch("/api/email", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load Gmail messages.");
        }

        const data = (await response.json()) as {
          accounts: GmailAccount[];
          connectionErrors: ConnectionError[];
        };

        if (cancelled) {
          return;
        }

        setAccounts(data.accounts ?? []);
        setConnectionErrors(data.connectionErrors ?? []);
      } catch (error) {
        console.error(
          error instanceof Error ? error.message : "Unable to load inbox.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInbox();

    return () => {
      cancelled = true;
    };
  }, []);

  const messages = useMemo(() => {
    const combined: InboxMessage[] = accounts.flatMap((account) =>
      account.messages.map((message) => ({
        ...message,
        accountEmail: account.email ?? "Unknown account",
        accountName: account.displayName ?? account.email ?? "Google account",
        accountColor: account.accountColor,
        triage: classifyMessage(message),
      })),
    );

    return combined
      .filter((message) =>
        selectedAccount === "all"
          ? true
          : message.accountEmail === selectedAccount,
      )
      .filter((message) =>
        selectedTriage === "all"
          ? true
          : message.triage === selectedTriage,
      )
      .sort((a, b) => {
        const priorityDifference =
          triageOrder[a.triage] - triageOrder[b.triage];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        const first = a.date ? new Date(a.date).getTime() : 0;
        const second = b.date ? new Date(b.date).getTime() : 0;

        return second - first;
      });
  }, [accounts, selectedAccount, selectedTriage]);

  const unreadCount = useMemo(
    () => messages.filter((message) => message.isUnread).length,
    [messages],
  );

  return (
    <main className="min-h-screen bg-[#F3EFE8] px-6 py-8 text-[#2C2C2C] md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#7C5F33]">
              Communications
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Inbox
            </h1>

            <p className="mt-2 max-w-2xl text-[#6B6B63]">
              One place for messages across your connected Gmail accounts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              disabled={isLoading}
              className="rounded-xl border border-[#C7BFB2] bg-white px-5 py-3 text-sm font-medium text-[#3F4742] transition hover:bg-[#F8F5F0] disabled:cursor-wait disabled:opacity-50"
            >
              {isLoading ? "Refreshing…" : "Refresh inbox"}
            </button>

            <div className="rounded-2xl border border-[#D7D0C5] bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A826E]">
                Unread
              </p>
              <p className="mt-1 text-3xl font-semibold text-[#1E3A34]">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSelectedAccount("all")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              selectedAccount === "all"
                ? "border-[#1E3A34] bg-[#1E3A34] text-white"
                : "border-[#D7D0C5] bg-white text-[#5F665C]"
            }`}
          >
            All accounts
          </button>

          {accounts.map((account) => {
            const color = normalizeColor(account.accountColor);

            return (
              <button
                key={account.integrationId}
                type="button"
                onClick={() => setSelectedAccount(account.email ?? "")}
                className="rounded-full border px-4 py-2 text-sm transition"
                style={
                  selectedAccount === account.email
                    ? {
                        backgroundColor: color,
                        borderColor: color,
                        color: "white",
                      }
                    : {
                        backgroundColor: `${color}14`,
                        borderColor: `${color}66`,
                        color: "#2C2C2C",
                      }
                }
              >
                {account.email}
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8B8479]">
            Jarvis Triage
          </span>

          {(
            [
              "all",
              "Urgent",
              "Action Needed",
              "Informational",
              "Low Priority",
            ] as const
          ).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedTriage(category)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selectedTriage === category
                  ? category === "all"
                    ? "border-[#1E3A34] bg-[#1E3A34] text-white"
                    : triageStyles[category]
                  : "border-[#D7D0C5] bg-white text-[#6B6B63] hover:bg-[#F8F5F0]"
              }`}
            >
              {category === "all" ? "All" : category}
            </button>
          ))}
        </div>

        {connectionErrors.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <p className="font-semibold text-amber-900">
              Some inboxes could not be loaded.
            </p>

            <div className="mt-3 space-y-2 text-sm text-amber-800">
              {connectionErrors.map((error) => (
                <div
                  key={error.integrationId}
                  className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p>
                    <span className="font-medium">
                      {error.email}
                    </span>
                    : {error.error}
                  </p>

                  <a
                    href="/api/integrations/google/connect?redirect=/inbox"
                    className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
                  >
                    Reconnect account
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-[#D7D0C5] bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-[#7A826E]">
              Loading inbox…
            </div>
          ) : messages.length === 0 ? (
            <div className="p-10 text-center text-[#7A826E]">
              No messages found.
            </div>
          ) : (
            <div className="divide-y divide-[#E6E0D7]">
              {messages.map((message) => {
                const color = normalizeColor(message.accountColor);

                return (
                  <article
                    key={`${message.accountEmail}:${message.externalId}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => void openEmail(message)}
                    onMouseEnter={() => void prefetchEmail(message)}
                    onFocus={() => void prefetchEmail(message)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void openEmail(message);
                      }
                    }}
                    className={`grid cursor-pointer gap-3 border-l-4 px-5 py-5 transition hover:bg-[#F8F5F0] md:grid-cols-[180px_1fr_90px] md:px-6 ${
                      message.isUnread ? "bg-[#F5F8F4]" : "bg-white"
                    }`}
                    style={{
                      borderLeftColor: color,
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm ${
                          message.isUnread
                            ? "font-semibold text-[#1E3A34]"
                            : "text-[#5F665C]"
                        }`}
                      >
                        {message.from ?? "Unknown sender"}
                      </p>

                      <p className="mt-1 flex items-center gap-2 truncate text-xs text-[#9A9388]">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {message.accountEmail}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {message.isUnread && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        )}

                        <h2
                          className={`min-w-0 truncate text-sm ${
                            message.isUnread
                              ? "font-semibold text-[#2C2C2C]"
                              : "font-medium text-[#4D4D48]"
                          }`}
                        >
                          {decodeHtml(message.subject)}
                        </h2>

                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${triageStyles[message.triage]}`}
                        >
                          {message.triage}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#7A756D]">
                        {decodeHtml(message.snippet)}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-xs font-medium text-[#8B8479]">
                        {formatMessageDate(message.date)}
                      </p>

                      {message.labels.includes("IMPORTANT") && (
                        <span
                          className="mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            backgroundColor: `${color}1F`,
                            color,
                          }}
                        >
                          Important
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {isOpeningMessage && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 px-4 backdrop-blur-[2px]">
            <div className="rounded-2xl border border-[#D7D0C5] bg-white px-6 py-5 shadow-xl">
              <p className="text-sm font-medium text-[#5F665C]">
                Opening message…
              </p>
            </div>
          </div>
        )}

        {messageError && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-red-200 bg-white p-4 shadow-xl">
            <p className="text-sm text-red-700">{messageError}</p>
            <button
              type="button"
              onClick={() => setMessageError(null)}
              className="mt-3 text-xs font-semibold text-[#1E3A34]"
            >
              Dismiss
            </button>
          </div>
        )}

        {openMessage && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/25 backdrop-blur-[2px]"
            onClick={() => setOpenMessage(null)}
          >
            <aside
              className="h-full w-full overflow-y-auto bg-[#F8F5F0] shadow-2xl sm:max-w-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="sticky top-0 z-10 border-b border-[#D7D0C5] bg-white px-6 py-5"
                style={{
                  borderTop: `5px solid ${normalizeColor(
                    openMessage.accountColor,
                  )}`,
                }}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p
                      className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]"
                      style={{
                        color: normalizeColor(openMessage.accountColor),
                      }}
                    >
                      {openMessage.accountEmail}
                    </p>

                    <h2 className="text-2xl font-semibold leading-tight text-[#2C2C2C]">
                      {decodeHtml(openMessage.message.subject)}
                    </h2>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsReplying(true);
                        setDraftStatus(null);
                      }}
                      className="rounded-full border border-[#1E3A34] bg-[#1E3A34] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#294B43]"
                    >
                      Reply
                    </button>

                    <button
                      type="button"
                      onClick={() => void updateReadState()}
                      disabled={isUpdatingMessage}
                      className="rounded-full border border-[#C7BFB2] bg-white px-4 py-2 text-sm text-[#5F665C] transition hover:bg-[#F3EFE8] disabled:opacity-50"
                    >
                      {openMessage.message.isUnread
                        ? "Mark Read"
                        : "Mark Unread"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void archiveOpenMessage()}
                      disabled={isUpdatingMessage}
                      className="rounded-full border border-[#C7BFB2] bg-white px-4 py-2 text-sm text-[#5F665C] transition hover:bg-[#F3EFE8] disabled:opacity-50"
                    >
                      Archive
                    </button>

                    <button
                      type="button"
                      onClick={() => void createTaskFromOpenMessage()}
                      disabled={isCreatingTask}
                      className="rounded-full border border-[#1E3A34] bg-[#1E3A34] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#294B43] disabled:cursor-wait disabled:opacity-60"
                    >
                      {isCreatingTask ? "Adding…" : "Add Task"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenMessage(null)}
                      className="rounded-full border border-[#D7D0C5] bg-white px-4 py-2 text-sm text-[#5F665C] transition hover:bg-[#F3EFE8]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                {draftStatus && (
                  <div className="mb-4 rounded-2xl border border-[#C9D5CC] bg-[#EEF3EF] px-4 py-3 text-sm text-[#4F6656]">
                    {draftStatus}
                  </div>
                )}

                {messageActionStatus && (
                  <div className="mb-4 rounded-2xl border border-[#C9D5CC] bg-[#EEF3EF] px-4 py-3 text-sm text-[#4F6656]">
                    {messageActionStatus}
                  </div>
                )}

                {taskMessage && (
                  <div className="mb-4 rounded-2xl border border-[#C9D5CC] bg-[#EEF3EF] px-4 py-3 text-sm text-[#4F6656]">
                    {taskMessage}
                  </div>
                )}

                <div className="rounded-2xl border border-[#D7D0C5] bg-white p-5">
                  <p className="text-sm font-semibold text-[#2C2C2C]">
                    {openMessage.message.from ?? "Unknown sender"}
                  </p>

                  <div className="mt-2 space-y-1 text-xs text-[#8B8479]">
                    {openMessage.message.to && (
                      <p>To: {openMessage.message.to}</p>
                    )}

                    {openMessage.message.cc && (
                      <p>CC: {openMessage.message.cc}</p>
                    )}

                    {openMessage.message.date && (
                      <p>
                        {new Date(openMessage.message.date).toLocaleString(
                          "en-US",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          },
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {isReplying && (
                  <div className="mt-5 rounded-2xl border border-[#C9D5CC] bg-[#EEF3EF] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4F6656]">
                          Reply draft
                        </p>

                        <p className="mt-1 text-sm text-[#6B6B63]">
                          To: {extractEmailAddress(openMessage.message.from)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsReplying(false);
                          setReplyBody("");
                        }}
                        className="text-sm text-[#6B6B63] hover:text-[#2C2C2C]"
                      >
                        Cancel
                      </button>
                    </div>

                    <textarea
                      value={replyBody}
                      onChange={(event) =>
                        setReplyBody(event.target.value)
                      }
                      rows={8}
                      placeholder="Write your reply..."
                      className="mt-4 w-full resize-y rounded-xl border border-[#C7BFB2] bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#B08D57]"
                    />

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void saveReplyDraft()}
                        disabled={
                          isSavingDraft ||
                          !replyBody.trim()
                        }
                        className="rounded-xl bg-[#1E3A34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294B43] disabled:cursor-wait disabled:opacity-50"
                      >
                        {isSavingDraft
                          ? "Saving draft…"
                          : "Save to Gmail Drafts"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5 rounded-2xl border border-[#D7D0C5] bg-white p-6">
                  {openMessage.message.bodyHtml ? (
                    <div
                      className="prose prose-sm max-w-none break-words text-[#3F3F3A]"
                      dangerouslySetInnerHTML={{
                        __html: openMessage.message.bodyHtml,
                      }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap break-words text-sm leading-7 text-[#3F3F3A]">
                      {openMessage.message.bodyText ??
                        openMessage.message.snippet ??
                        "This message has no readable text content."}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
