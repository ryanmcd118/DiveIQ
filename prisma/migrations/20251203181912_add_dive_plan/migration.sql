-- CreateTable
CREATE TABLE "DivePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "maxDepth" INTEGER NOT NULL,
    "bottomTime" INTEGER NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "aiAdvice" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
