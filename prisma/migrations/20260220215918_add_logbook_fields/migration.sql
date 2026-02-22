-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiveLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "date" TEXT NOT NULL,
    "startTime" TEXT,
    "diveNumber" INTEGER,
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
INSERT INTO "new_DiveLog" ("bottomTime", "buddyName", "createdAt", "date", "id", "maxDepthCm", "notes", "region", "siteName", "userId", "visibilityCm", "waterTempCx10") SELECT "bottomTime", "buddyName", "createdAt", "date", "id", "maxDepthCm", "notes", "region", "siteName", "userId", "visibilityCm", "waterTempCx10" FROM "DiveLog";
DROP TABLE "DiveLog";
ALTER TABLE "new_DiveLog" RENAME TO "DiveLog";
CREATE INDEX "DiveLog_userId_idx" ON "DiveLog"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
