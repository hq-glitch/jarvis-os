-- CreateTable
CREATE TABLE "PlaidItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plaidItemId" TEXT NOT NULL,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "encryptedAccessToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSyncedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "PlaidItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FinancialAccount" (
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
    "plaidItemId" TEXT,
    "plaidAccountId" TEXT,
    "plaidMask" TEXT,
    CONSTRAINT "FinancialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FinancialAccount_plaidItemId_fkey" FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinancialAccount" ("accountType", "createdAt", "currentBalance", "id", "institution", "interestRate", "isDebt", "isDebtTarget", "minimumPayment", "name", "notes", "startingBalance", "updatedAt", "userId") SELECT "accountType", "createdAt", "currentBalance", "id", "institution", "interestRate", "isDebt", "isDebtTarget", "minimumPayment", "name", "notes", "startingBalance", "updatedAt", "userId" FROM "FinancialAccount";
DROP TABLE "FinancialAccount";
ALTER TABLE "new_FinancialAccount" RENAME TO "FinancialAccount";
CREATE UNIQUE INDEX "FinancialAccount_plaidAccountId_key" ON "FinancialAccount"("plaidAccountId");
CREATE INDEX "FinancialAccount_userId_idx" ON "FinancialAccount"("userId");
CREATE INDEX "FinancialAccount_plaidItemId_idx" ON "FinancialAccount"("plaidItemId");
CREATE INDEX "FinancialAccount_userId_isDebt_idx" ON "FinancialAccount"("userId", "isDebt");
CREATE INDEX "FinancialAccount_userId_isDebtTarget_idx" ON "FinancialAccount"("userId", "isDebtTarget");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PlaidItem_plaidItemId_key" ON "PlaidItem"("plaidItemId");

-- CreateIndex
CREATE INDEX "PlaidItem_userId_idx" ON "PlaidItem"("userId");

-- CreateIndex
CREATE INDEX "PlaidItem_status_idx" ON "PlaidItem"("status");
