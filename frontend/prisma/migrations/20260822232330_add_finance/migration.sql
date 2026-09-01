-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "institution" TEXT,
    "accountType" TEXT NOT NULL,
    "isDebt" BOOLEAN NOT NULL DEFAULT false,
    "isDebtTarget" BOOLEAN NOT NULL DEFAULT false,
    "startingBalance" REAL NOT NULL DEFAULT 0,
    "currentBalance" REAL NOT NULL DEFAULT 0,
    "minimumPayment" REAL,
    "interestRate" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "FinancialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "dueDay" INTEGER,
    "nextDueAt" DATETIME,
    "isAutopay" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bill_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FinancialAccount_userId_idx" ON "FinancialAccount"("userId");

-- CreateIndex
CREATE INDEX "FinancialAccount_userId_isDebt_idx" ON "FinancialAccount"("userId", "isDebt");

-- CreateIndex
CREATE INDEX "FinancialAccount_userId_isDebtTarget_idx" ON "FinancialAccount"("userId", "isDebtTarget");

-- CreateIndex
CREATE INDEX "Bill_userId_idx" ON "Bill"("userId");

-- CreateIndex
CREATE INDEX "Bill_nextDueAt_idx" ON "Bill"("nextDueAt");

-- CreateIndex
CREATE INDEX "Bill_accountId_idx" ON "Bill"("accountId");
