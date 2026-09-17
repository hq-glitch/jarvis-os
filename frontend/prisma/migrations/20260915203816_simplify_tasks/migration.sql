/*
  Warnings:

  - You are about to drop the `ProjectTask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `priority` on the `Task` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ProjectTask_projectId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProjectTask";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "dueAt" DATETIME,
    "completedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "inTaskList" BOOLEAN NOT NULL DEFAULT true,
    "sourceType" TEXT,
    "sourceAccount" TEXT,
    "sourceMessageId" TEXT,
    "sourceThreadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "areaId" TEXT,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("areaId", "completedAt", "createdAt", "description", "dueAt", "id", "projectId", "sourceAccount", "sourceMessageId", "sourceThreadId", "sourceType", "status", "title", "updatedAt", "userId") SELECT "areaId", "completedAt", "createdAt", "description", "dueAt", "id", "projectId", "sourceAccount", "sourceMessageId", "sourceThreadId", "sourceType", "status", "title", "updatedAt", "userId" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt");
CREATE INDEX "Task_sourceMessageId_idx" ON "Task"("sourceMessageId");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_areaId_idx" ON "Task"("areaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
