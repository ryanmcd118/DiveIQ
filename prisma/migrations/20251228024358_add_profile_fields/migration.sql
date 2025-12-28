-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "image" TEXT,
    "birthday" DATETIME,
    "location" TEXT,
    "bio" TEXT,
    "pronouns" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "email", "emailVerified", "password", "firstName", "lastName", "image", "createdAt", "updatedAt")
SELECT "id", "email", "emailVerified", "password", "firstName", "lastName", "image", "createdAt", "updatedAt"
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

