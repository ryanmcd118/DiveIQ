-- CreateTable
CREATE TABLE "GearItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "nickname" TEXT,
    "purchaseDate" DATETIME,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastServicedAt" DATETIME,
    "serviceIntervalMonths" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GearItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GearKit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GearKit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GearKitItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kitId" TEXT NOT NULL,
    "gearItemId" TEXT NOT NULL,
    CONSTRAINT "GearKitItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "GearKit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GearKitItem_gearItemId_fkey" FOREIGN KEY ("gearItemId") REFERENCES "GearItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiveGearItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diveId" TEXT NOT NULL,
    "gearItemId" TEXT NOT NULL,
    CONSTRAINT "DiveGearItem_diveId_fkey" FOREIGN KEY ("diveId") REFERENCES "DiveLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiveGearItem_gearItemId_fkey" FOREIGN KEY ("gearItemId") REFERENCES "GearItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GearItem_userId_idx" ON "GearItem"("userId");

-- CreateIndex
CREATE INDEX "GearItem_userId_isActive_idx" ON "GearItem"("userId", "isActive");

-- CreateIndex
CREATE INDEX "GearKit_userId_idx" ON "GearKit"("userId");

-- CreateIndex
CREATE INDEX "GearKit_userId_isDefault_idx" ON "GearKit"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "GearKitItem_kitId_idx" ON "GearKitItem"("kitId");

-- CreateIndex
CREATE INDEX "GearKitItem_gearItemId_idx" ON "GearKitItem"("gearItemId");

-- CreateIndex
CREATE UNIQUE INDEX "GearKitItem_kitId_gearItemId_key" ON "GearKitItem"("kitId", "gearItemId");

-- CreateIndex
CREATE INDEX "DiveGearItem_diveId_idx" ON "DiveGearItem"("diveId");

-- CreateIndex
CREATE INDEX "DiveGearItem_gearItemId_idx" ON "DiveGearItem"("gearItemId");

-- CreateIndex
CREATE UNIQUE INDEX "DiveGearItem_diveId_gearItemId_key" ON "DiveGearItem"("diveId", "gearItemId");
