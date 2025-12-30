/*
  Warnings:

  - You are about to drop the column `maxDepth` on the `DiveLog` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `DiveLog` table. All the data in the column will be lost.
  - You are about to drop the column `waterTemp` on the `DiveLog` table. All the data in the column will be lost.
  - You are about to drop the column `maxDepth` on the `DivePlan` table. All the data in the column will be lost.
  - Added the required column `maxDepthCm` to the `DiveLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxDepthCm` to the `DivePlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "unitPreferences" JSONB;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiveLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "date" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "maxDepthCm" INTEGER NOT NULL,
    "bottomTime" INTEGER NOT NULL,
    "waterTempCx10" INTEGER,
    "visibilityCm" INTEGER,
    "buddyName" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiveLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DiveLog" ("bottomTime", "buddyName", "createdAt", "date", "id", "notes", "region", "siteName", "userId") SELECT "bottomTime", "buddyName", "createdAt", "date", "id", "notes", "region", "siteName", "userId" FROM "DiveLog";
DROP TABLE "DiveLog";
ALTER TABLE "new_DiveLog" RENAME TO "DiveLog";
CREATE INDEX "DiveLog_userId_idx" ON "DiveLog"("userId");
CREATE TABLE "new_DivePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "date" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "maxDepthCm" INTEGER NOT NULL,
    "bottomTime" INTEGER NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "aiAdvice" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DivePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DivePlan" ("aiAdvice", "bottomTime", "createdAt", "date", "experienceLevel", "id", "region", "riskLevel", "siteName", "userId") SELECT "aiAdvice", "bottomTime", "createdAt", "date", "experienceLevel", "id", "region", "riskLevel", "siteName", "userId" FROM "DivePlan";
DROP TABLE "DivePlan";
ALTER TABLE "new_DivePlan" RENAME TO "DivePlan";
CREATE INDEX "DivePlan_userId_idx" ON "DivePlan"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
