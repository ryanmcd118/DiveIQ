-- CreateTable
CREATE TABLE "DiveLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "maxDepth" INTEGER NOT NULL,
    "bottomTime" INTEGER NOT NULL,
    "waterTemp" INTEGER,
    "visibility" INTEGER,
    "buddyName" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
