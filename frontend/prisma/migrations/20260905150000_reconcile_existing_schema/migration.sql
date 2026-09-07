-- CreateTable
CREATE TABLE "SocialContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "series" TEXT,
    "caption" TEXT,
    "hashtags" TEXT,
    "publishAt" DATETIME,
    "publishedUrl" TEXT,
    "notes" TEXT,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "dueAt" DATETIME,
    "completedAt" DATETIME,
    "sourceType" TEXT,
    "sourceAccount" TEXT,
    "sourceMessageId" TEXT,
    "sourceThreadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("completedAt", "createdAt", "description", "dueAt", "id", "priority", "sourceAccount", "sourceMessageId", "sourceThreadId", "sourceType", "status", "title", "updatedAt", "userId") SELECT "completedAt", "createdAt", "description", "dueAt", "id", "priority", "sourceAccount", "sourceMessageId", "sourceThreadId", "sourceType", "status", "title", "updatedAt", "userId" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId" ASC);
CREATE INDEX "Task_sourceMessageId_idx" ON "Task"("sourceMessageId" ASC);
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt" ASC);
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId" ASC, "status" ASC);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SocialContent_projectId_idx" ON "SocialContent"("projectId" ASC);

-- CreateIndex
CREATE INDEX "SocialContent_publishAt_idx" ON "SocialContent"("publishAt" ASC);

-- CreateIndex
CREATE INDEX "SocialContent_userId_platform_idx" ON "SocialContent"("userId" ASC, "platform" ASC);

-- CreateIndex
CREATE INDEX "SocialContent_userId_status_idx" ON "SocialContent"("userId" ASC, "status" ASC);
