-- CreateTable
CREATE TABLE "CalendarSourceSync" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "sourceAccount" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "htmlLink" TEXT,
    "title" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "CalendarSourceSync_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CalendarSourceSync_userId_idx" ON "CalendarSourceSync"("userId");

-- CreateIndex
CREATE INDEX "CalendarSourceSync_calendarId_idx" ON "CalendarSourceSync"("calendarId");

-- CreateIndex
CREATE INDEX "CalendarSourceSync_externalEventId_idx" ON "CalendarSourceSync"("externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSourceSync_userId_sourceType_sourceAccount_sourceId_key" ON "CalendarSourceSync"("userId", "sourceType", "sourceAccount", "sourceId");
