-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "nextAction" TEXT,
    "notes" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("areaId", "createdAt", "description", "id", "name", "nextAction", "notes", "progress", "sourceId", "sourceType", "status", "updatedAt", "userId") SELECT "areaId", "createdAt", "description", "id", "name", "nextAction", "notes", "progress", "sourceId", "sourceType", "status", "updatedAt", "userId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_areaId_idx" ON "Project"("areaId");
CREATE INDEX "Project_userId_idx" ON "Project"("userId");
CREATE INDEX "Project_userId_status_idx" ON "Project"("userId", "status");
CREATE UNIQUE INDEX "Project_userId_sourceType_sourceId_key" ON "Project"("userId", "sourceType", "sourceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
