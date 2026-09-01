# Jarvis OS Architecture

## 1. Purpose

Jarvis OS is a personal operating system that unifies calendars, projects, tasks, inboxes, files, contacts, automations, and AI-assisted planning.

Jarvis must support:

- Five Google accounts immediately
- Additional Google accounts later without structural changes
- One Apple/iCloud calendar account immediately
- Additional providers later, including Microsoft 365
- Multiple calendars per connected account
- A unified local calendar and event model
- Secure credential storage
- AI-assisted planning across all connected data

The architecture must favor long-term stability, clear boundaries, and incremental expansion.

---

## 2. Core Principles

1. Jarvis owns the internal data model.
2. External services are integrations, not the source of application structure.
3. Pages render interfaces.
4. Components display and collect data.
5. Services contain business logic.
6. Providers communicate with external APIs.
7. Database access is isolated from the UI.
8. OAuth credentials never reach client-side code.
9. Every schema change uses a migration.
10. Features must be built as complete vertical slices.
11. Existing working behavior must be preserved during migrations.
12. Provider-specific details must not leak into shared calendar logic.

---

## 3. Permanent Application Modules

Jarvis will use these major product modules:

- Dashboard
- Calendar
- Projects
- Inbox
- Tasks
- Files
- People
- Search
- Automations
- AI
- Settings

Not every module must be completed in Version 1, but the architecture must leave a permanent place for each.

---

## 4. Folder Structure

```text
frontend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── integrations/
│   │   │   ├── calendars/
│   │   │   ├── events/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   └── inbox/
│   │   │
│   │   ├── calendar/
│   │   ├── projects/
│   │   ├── inbox/
│   │   ├── tasks/
│   │   ├── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── calendar/
│   │   ├── dashboard/
│   │   ├── integrations/
│   │   ├── layout/
│   │   ├── projects/
│   │   └── ui/
│   │
│   ├── services/
│   │   ├── calendar-service.ts
│   │   ├── integration-service.ts
│   │   ├── sync-service.ts
│   │   ├── project-service.ts
│   │   └── task-service.ts
│   │
│   ├── lib/
│   │   ├── db/
│   │   ├── crypto/
│   │   ├── providers/
│   │   │   ├── google/
│   │   │   ├── apple/
│   │   │   └── microsoft/
│   │   ├── validation/
│   │   └── utils/
│   │
│   ├── hooks/
│   ├── types/
│   └── generated/
│
├── .env.local
├── .gitignore
├── next.config.ts
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── JARVIS_ARCHITECTURE.md