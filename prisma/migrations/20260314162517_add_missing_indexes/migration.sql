-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "DiveLog_userId_createdAt_idx" ON "DiveLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DiveLog_userId_date_idx" ON "DiveLog"("userId", "date");

-- CreateIndex
CREATE INDEX "DivePlan_userId_createdAt_idx" ON "DivePlan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
