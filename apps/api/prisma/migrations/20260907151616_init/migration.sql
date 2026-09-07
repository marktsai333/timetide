-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT,
    "deviceTokenHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pairing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviteCode" TEXT,
    "inviteCodeExpiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "userAId" TEXT NOT NULL,
    "userBId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    CONSTRAINT "Pairing_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pairing_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimezoneProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ianaTimezone" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "colorHex" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimezoneProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "syncMode" TEXT NOT NULL DEFAULT 'FREE_BUSY_ONLY',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "externalAccountEmail" TEXT,
    "accessTokenEnc" TEXT,
    "refreshTokenEnc" TEXT,
    "tokenExpiresAt" DATETIME,
    "scopesGranted" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarBusyBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calendarConnectionId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pairingId" TEXT NOT NULL,
    "proposedByUserId" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "syncToCalendar" BOOLEAN NOT NULL DEFAULT false,
    "reminderOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "Meeting_pairingId_fkey" FOREIGN KEY ("pairingId") REFERENCES "Pairing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Meeting_proposedByUserId_fkey" FOREIGN KEY ("proposedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_deviceTokenHash_key" ON "User"("deviceTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Pairing_inviteCode_key" ON "Pairing"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "TimezoneProfile_userId_key" ON "TimezoneProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarBusyBlock_calendarConnectionId_externalEventId_key" ON "CalendarBusyBlock"("calendarConnectionId", "externalEventId");
