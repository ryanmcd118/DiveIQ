-- CreateTable
CREATE TABLE "UserProfileKit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserProfileKit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserProfileKit_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "GearKit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserProfileKit_userId_idx" ON "UserProfileKit"("userId");

-- CreateIndex
CREATE INDEX "UserProfileKit_kitId_idx" ON "UserProfileKit"("kitId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfileKit_userId_kitId_key" ON "UserProfileKit"("userId", "kitId");
