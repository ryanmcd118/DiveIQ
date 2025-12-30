-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "bio", "birthday", "certifyingAgency", "createdAt", "email", "emailVerified", "experienceLevel", "favoriteDiveLocation", "favoriteDiveType", "firstName", "homeDiveRegion", "id", "image", "languages", "lastName", "location", "lookingFor", "password", "primaryDiveTypes", "pronouns", "sessionVersion", "typicalDivingEnvironment", "unitPreferences", "updatedAt", "website", "yearsDiving") SELECT "avatarUrl", "bio", "birthday", "certifyingAgency", "createdAt", "email", "emailVerified", "experienceLevel", "favoriteDiveLocation", "favoriteDiveType", "firstName", "homeDiveRegion", "id", "image", "languages", "lastName", "location", "lookingFor", "password", "primaryDiveTypes", "pronouns", "sessionVersion", "typicalDivingEnvironment", "unitPreferences", "updatedAt", "website", "yearsDiving" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
