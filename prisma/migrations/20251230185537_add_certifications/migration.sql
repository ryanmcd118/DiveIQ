-- CreateTable
CREATE TABLE "CertificationDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agency" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "levelRank" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "badgeImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserCertification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "certificationDefinitionId" TEXT NOT NULL,
    "earnedDate" DATETIME,
    "certNumber" TEXT,
    "diveShop" TEXT,
    "location" TEXT,
    "instructor" TEXT,
    "notes" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCertification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCertification_certificationDefinitionId_fkey" FOREIGN KEY ("certificationDefinitionId") REFERENCES "CertificationDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CertificationDefinition_agency_slug_key" ON "CertificationDefinition"("agency", "slug");

-- CreateIndex
CREATE INDEX "UserCertification_userId_idx" ON "UserCertification"("userId");

-- CreateIndex
CREATE INDEX "UserCertification_certificationDefinitionId_idx" ON "UserCertification"("certificationDefinitionId");

-- CreateIndex
CREATE INDEX "UserCertification_userId_isFeatured_idx" ON "UserCertification"("userId", "isFeatured");
