-- CreateTable
CREATE TABLE "AutomationActionState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "taskId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "snoozedUntil" DATETIME,
    "dismissedAt" DATETIME,
    "approvedAt" DATETIME,
    "executedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "AutomationActionState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AutomationActionState_userId_status_idx" ON "AutomationActionState"("userId", "status");

-- CreateIndex
CREATE INDEX "AutomationActionState_taskId_idx" ON "AutomationActionState"("taskId");

-- CreateIndex
CREATE INDEX "AutomationActionState_snoozedUntil_idx" ON "AutomationActionState"("snoozedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationActionState_userId_actionId_key" ON "AutomationActionState"("userId", "actionId");
