-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userIdentifier" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "categories" TEXT NOT NULL,
    "wordingVersion" TEXT NOT NULL,
    "geoRegion" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DsrRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userIdentifier" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ConsentLog_userIdentifier_idx" ON "ConsentLog"("userIdentifier");

-- CreateIndex
CREATE INDEX "DsrRequest_userIdentifier_idx" ON "DsrRequest"("userIdentifier");

-- CreateIndex
CREATE INDEX "DsrRequest_type_idx" ON "DsrRequest"("type");
