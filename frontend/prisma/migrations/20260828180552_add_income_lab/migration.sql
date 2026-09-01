-- CreateTable
CREATE TABLE "IncomeOpportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESEARCHING',
    "description" TEXT,
    "notes" TEXT,
    "sourceUrl" TEXT,
    "startupCost" REAL,
    "monthlyPotential" REAL,
    "timeToFirstDollar" TEXT,
    "effortScore" INTEGER,
    "scalabilityScore" INTEGER,
    "privacyRiskScore" INTEGER,
    "jarvisScore" REAL,
    "nextAction" TEXT,
    "actualIncome" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "IncomeOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "IncomeOpportunity_userId_idx" ON "IncomeOpportunity"("userId");

-- CreateIndex
CREATE INDEX "IncomeOpportunity_userId_status_idx" ON "IncomeOpportunity"("userId", "status");
