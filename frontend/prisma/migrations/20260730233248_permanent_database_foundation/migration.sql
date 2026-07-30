/*
  Warnings:

  - You are about to drop the `GoogleAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GoogleCalendar` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GoogleAccount";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GoogleCalendar";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "displayName" TEXT,
    "timeZone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSyncedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntegrationCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "encryptedPayload" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "integrationId" TEXT NOT NULL,
    CONSTRAINT "IntegrationCredential_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExternalCalendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "timeZone" TEXT,
    "providerColor" TEXT,
    "customColor" TEXT,
    "accessRole" TEXT NOT NULL DEFAULT 'READER',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isReadOnly" BOOLEAN NOT NULL DEFAULT true,
    "syncCursor" TEXT,
    "lastSyncedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT,
    CONSTRAINT "ExternalCalendar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExternalCalendar_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "htmlLink" TEXT,
    "etag" TEXT,
    "recurrenceRule" TEXT,
    "recurringEventId" TEXT,
    "originalStartAt" DATETIME,
    "sourceUpdatedAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "calendarId" TEXT NOT NULL,
    CONSTRAINT "CalendarEvent_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "ExternalCalendar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OAuthState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "redirectPath" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "OAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserSetting_userId_idx" ON "UserSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_key_key" ON "UserSetting"("userId", "key");

-- CreateIndex
CREATE INDEX "Integration_userId_provider_idx" ON "Integration"("userId", "provider");

-- CreateIndex
CREATE INDEX "Integration_status_idx" ON "Integration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_userId_provider_providerAccountId_key" ON "Integration"("userId", "provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCredential_integrationId_key" ON "IntegrationCredential"("integrationId");

-- CreateIndex
CREATE INDEX "ExternalCalendar_userId_idx" ON "ExternalCalendar"("userId");

-- CreateIndex
CREATE INDEX "ExternalCalendar_integrationId_isEnabled_idx" ON "ExternalCalendar"("integrationId", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalCalendar_integrationId_externalId_key" ON "ExternalCalendar"("integrationId", "externalId");

-- CreateIndex
CREATE INDEX "CalendarEvent_calendarId_startAt_idx" ON "CalendarEvent"("calendarId", "startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_startAt_idx" ON "CalendarEvent"("startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_endAt_idx" ON "CalendarEvent"("endAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_recurringEventId_idx" ON "CalendarEvent"("recurringEventId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_calendarId_externalId_key" ON "CalendarEvent"("calendarId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthState_state_key" ON "OAuthState"("state");

-- CreateIndex
CREATE INDEX "OAuthState_userId_idx" ON "OAuthState"("userId");

-- CreateIndex
CREATE INDEX "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");
