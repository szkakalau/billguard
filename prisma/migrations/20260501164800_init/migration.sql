-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ApiKeyProvider" AS ENUM ('openai');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('active', 'capped', 'disabled');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('email', 'slack');

-- CreateEnum
CREATE TYPE "AlertThreshold" AS ENUM ('p50', 'p90', 'p100');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "githubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "ApiKeyProvider" NOT NULL DEFAULT 'openai',
    "ciphertext" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "tag" BYTEA NOT NULL,
    "keyHash" TEXT NOT NULL,
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'active',
    "lastTestedAt" TIMESTAMP(3),
    "lastValidAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "dailyBudgetUsd" DECIMAL(12,4),
    "monthlyBudgetUsd" DECIMAL(12,4),
    "notifyEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "slackWebhookCiphertext" BYTEA,
    "slackWebhookIv" BYTEA,
    "slackWebhookTag" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "costUsd" DECIMAL(12,4) NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "threshold" "AlertThreshold" NOT NULL,
    "channel" "AlertChannel" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_status_idx" ON "ApiKey"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_userId_keyHash_key" ON "ApiKey"("userId", "keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "AlertRule_apiKeyId_key" ON "AlertRule"("apiKeyId");

-- CreateIndex
CREATE INDEX "AlertRule_userId_idx" ON "AlertRule"("userId");

-- CreateIndex
CREATE INDEX "UsageRecord_apiKeyId_date_idx" ON "UsageRecord"("apiKeyId", "date");

-- CreateIndex
CREATE INDEX "AlertEvent_apiKeyId_date_idx" ON "AlertEvent"("apiKeyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AlertEvent_apiKeyId_date_threshold_channel_key" ON "AlertEvent"("apiKeyId", "date", "threshold", "channel");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

