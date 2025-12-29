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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
-- Migrate existing data: split name into firstName and lastName
INSERT INTO "new_User" ("id", "email", "emailVerified", "password", "firstName", "lastName", "image", "createdAt", "updatedAt")
SELECT 
    "id",
    "email",
    "emailVerified",
    "password",
    CASE 
        WHEN "name" IS NULL OR "name" = '' THEN NULL
        WHEN instr("name", ' ') = 0 THEN "name"
        ELSE substr("name", 1, instr("name", ' ') - 1)
    END as "firstName",
    CASE 
        WHEN "name" IS NULL OR "name" = '' OR instr("name", ' ') = 0 THEN NULL
        ELSE trim(substr("name", instr("name", ' ') + 1))
    END as "lastName",
    "image",
    "createdAt",
    "updatedAt"
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

