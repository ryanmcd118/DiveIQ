-- AlterTable
ALTER TABLE "GearItem" ADD COLUMN "condition" TEXT;
ALTER TABLE "GearItem" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "GearItem" ADD COLUMN "purchaseShop" TEXT;
ALTER TABLE "GearItem" ADD COLUMN "serialNumber" TEXT;
ALTER TABLE "GearItem" ADD COLUMN "serviceIntervalDives" INTEGER;

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
    "rating" INTEGER,
    "placeId" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "country" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "divePlanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiveLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiveLog_divePlanId_fkey" FOREIGN KEY ("divePlanId") REFERENCES "DivePlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DiveLog" ("bottomTime", "buddyName", "createdAt", "current", "date", "diveNumber", "diveNumberAuto", "diveNumberOverride", "diveTypeTags", "endPressureBar", "endTime", "exposureProtection", "fO2", "gasType", "gearKitId", "gearNotes", "id", "isTrainingDive", "maxDepthCm", "notes", "region", "safetyStopDepthCm", "safetyStopDurationMin", "siteName", "startPressureBar", "startTime", "surfaceIntervalMin", "tankCylinder", "trainingCourse", "trainingInstructor", "trainingSkills", "updatedAt", "userId", "visibilityCm", "waterTempBottomCx10", "waterTempCx10", "weightUsedKg") SELECT "bottomTime", "buddyName", "createdAt", "current", "date", "diveNumber", "diveNumberAuto", "diveNumberOverride", "diveTypeTags", "endPressureBar", "endTime", "exposureProtection", "fO2", "gasType", "gearKitId", "gearNotes", "id", "isTrainingDive", "maxDepthCm", "notes", "region", "safetyStopDepthCm", "safetyStopDurationMin", "siteName", "startPressureBar", "startTime", "surfaceIntervalMin", "tankCylinder", "trainingCourse", "trainingInstructor", "trainingSkills", "updatedAt", "userId", "visibilityCm", "waterTempBottomCx10", "waterTempCx10", "weightUsedKg" FROM "DiveLog";
DROP TABLE "DiveLog";
ALTER TABLE "new_DiveLog" RENAME TO "DiveLog";
CREATE INDEX "DiveLog_userId_idx" ON "DiveLog"("userId");
CREATE INDEX "DiveLog_userId_createdAt_idx" ON "DiveLog"("userId", "createdAt");
CREATE INDEX "DiveLog_userId_date_idx" ON "DiveLog"("userId", "date");
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
    "placeId" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "country" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "plannedDate" DATETIME,
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DivePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DivePlan" ("aiAdvice", "aiBriefing", "bottomTime", "createdAt", "date", "experienceLevel", "id", "maxDepthCm", "region", "riskLevel", "siteName", "updatedAt", "userId") SELECT "aiAdvice", "aiBriefing", "bottomTime", "createdAt", "date", "experienceLevel", "id", "maxDepthCm", "region", "riskLevel", "siteName", "updatedAt", "userId" FROM "DivePlan";
DROP TABLE "DivePlan";
ALTER TABLE "new_DivePlan" RENAME TO "DivePlan";
CREATE UNIQUE INDEX "DivePlan_shareToken_key" ON "DivePlan"("shareToken");
CREATE INDEX "DivePlan_userId_idx" ON "DivePlan"("userId");
CREATE INDEX "DivePlan_userId_createdAt_idx" ON "DivePlan"("userId", "createdAt");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "password" TEXT,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "firstName" TEXT,
    "lastName" TEXT,
    "image" TEXT,
    "avatarUrl" TEXT,
    "birthday" DATETIME,
    "location" TEXT,
    "bio" TEXT,
    "pronouns" TEXT,
    "website" TEXT,
    "homeDiveRegion" TEXT,
    "languages" TEXT,
    "primaryDiveTypes" TEXT,
    "experienceLevel" TEXT,
    "yearsDiving" INTEGER,
    "certifyingAgency" TEXT,
    "typicalDivingEnvironment" TEXT,
    "lookingFor" TEXT,
    "favoriteDiveType" TEXT,
    "favoriteDiveLocation" TEXT,
    "unitPreferences" JSONB,
    "showCertificationsOnProfile" BOOLEAN NOT NULL DEFAULT true,
    "showGearOnProfile" BOOLEAN NOT NULL DEFAULT true,
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "bio", "birthday", "certifyingAgency", "createdAt", "email", "emailVerified", "experienceLevel", "favoriteDiveLocation", "favoriteDiveType", "firstName", "homeDiveRegion", "id", "image", "languages", "lastName", "location", "lookingFor", "password", "primaryDiveTypes", "pronouns", "sessionVersion", "showCertificationsOnProfile", "showGearOnProfile", "typicalDivingEnvironment", "unitPreferences", "updatedAt", "website", "yearsDiving") SELECT "avatarUrl", "bio", "birthday", "certifyingAgency", "createdAt", "email", "emailVerified", "experienceLevel", "favoriteDiveLocation", "favoriteDiveType", "firstName", "homeDiveRegion", "id", "image", "languages", "lastName", "location", "lookingFor", "password", "primaryDiveTypes", "pronouns", "sessionVersion", "showCertificationsOnProfile", "showGearOnProfile", "typicalDivingEnvironment", "unitPreferences", "updatedAt", "website", "yearsDiving" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
