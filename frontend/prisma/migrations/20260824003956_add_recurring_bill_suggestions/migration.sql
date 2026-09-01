-- CreateTable
CREATE TABLE "RecurringBillSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plaidStreamId" TEXT NOT NULL,
    "merchantName" TEXT,
    "description" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "averageAmount" REAL NOT NULL,
    "lastAmount" REAL,
    "firstDate" DATETIME,
    "lastDate" DATETIME,
    "predictedNextDate" DATETIME,
    "status" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "RecurringBillSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RecurringBillSuggestion_plaidStreamId_key" ON "RecurringBillSuggestion"("plaidStreamId");

-- CreateIndex
CREATE INDEX "RecurringBillSuggestion_userId_reviewStatus_idx" ON "RecurringBillSuggestion"("userId", "reviewStatus");

-- CreateIndex
CREATE INDEX "RecurringBillSuggestion_predictedNextDate_idx" ON "RecurringBillSuggestion"("predictedNextDate");
