/*
  Warnings:

  - Made the column `userId` on table `DiveLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `DivePlan` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiveLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "diveNumber" INTEGER,
    "diveNumberAuto" INTEGER,
    "diveNumberOverride" INTEGER,
    "region" TEXT,
    "siteName" TEXT NOT NULL,
    "buddyName" TEXT,
    "diveTypeTags" TEXT,
    "maxDepthCm" INTEGER,
    "bottomTime" INTEGER,
    "safetyStopDepthCm" INTEGER,
    "safetyStopDurationMin" INTEGER,
    "surfaceIntervalMin" INTEGER,
    "waterTempCx10" INTEGER,
    "waterTempBottomCx10" INTEGER,
    "visibilityCm" INTEGER,
    "current" TEXT,
    "gasType" TEXT,
    "fO2" INTEGER,
    "tankCylinder" TEXT,
    "startPressureBar" REAL,
    "endPressureBar" REAL,
    "exposureProtection" TEXT,
    "weightUsedKg" REAL,
    "gearKitId" TEXT,
    "gearNotes" TEXT,
    "isTrainingDive" BOOLEAN NOT NULL DEFAULT false,
    "trainingCourse" TEXT,
    "trainingInstructor" TEXT,
    "trainingSkills" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiveLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DiveLog" ("bottomTime", "buddyName", "createdAt", "current", "date", "diveNumber", "diveNumberAuto", "diveNumberOverride", "diveTypeTags", "endPressureBar", "endTime", "exposureProtection", "fO2", "gasType", "gearKitId", "gearNotes", "id", "isTrainingDive", "maxDepthCm", "notes", "region", "safetyStopDepthCm", "safetyStopDurationMin", "siteName", "startPressureBar", "startTime", "surfaceIntervalMin", "tankCylinder", "trainingCourse", "trainingInstructor", "trainingSkills", "userId", "visibilityCm", "waterTempBottomCx10", "waterTempCx10", "weightUsedKg") SELECT "bottomTime", "buddyName", "createdAt", "current", "date", "diveNumber", "diveNumberAuto", "diveNumberOverride", "diveTypeTags", "endPressureBar", "endTime", "exposureProtection", "fO2", "gasType", "gearKitId", "gearNotes", "id", "isTrainingDive", "maxDepthCm", "notes", "region", "safetyStopDepthCm", "safetyStopDurationMin", "siteName", "startPressureBar", "startTime", "surfaceIntervalMin", "tankCylinder", "trainingCourse", "trainingInstructor", "trainingSkills", "userId", "visibilityCm", "waterTempBottomCx10", "waterTempCx10", "weightUsedKg" FROM "DiveLog";
DROP TABLE "DiveLog";
ALTER TABLE "new_DiveLog" RENAME TO "DiveLog";
CREATE INDEX "DiveLog_userId_idx" ON "DiveLog"("userId");
CREATE TABLE "new_DivePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "maxDepthCm" INTEGER NOT NULL,
    "bottomTime" INTEGER NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "aiAdvice" TEXT,
    "aiBriefing" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DivePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DivePlan" ("aiAdvice", "aiBriefing", "bottomTime", "createdAt", "date", "experienceLevel", "id", "maxDepthCm", "region", "riskLevel", "siteName", "userId") SELECT "aiAdvice", "aiBriefing", "bottomTime", "createdAt", "date", "experienceLevel", "id", "maxDepthCm", "region", "riskLevel", "siteName", "userId" FROM "DivePlan";
DROP TABLE "DivePlan";
ALTER TABLE "new_DivePlan" RENAME TO "DivePlan";
CREATE INDEX "DivePlan_userId_idx" ON "DivePlan"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
