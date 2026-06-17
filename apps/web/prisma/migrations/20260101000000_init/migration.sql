-- CreateEnum
CREATE TYPE "Language" AS ENUM ('kz', 'ru');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('wedding', 'toy', 'betashar', 'kyz_uzatu', 'birthday', 'anniversary', 'corporate', 'other');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "GuestResponseStatus" AS ENUM ('pending', 'attending', 'not_attending', 'attending_plus_one');

-- CreateEnum
CREATE TYPE "GuestSide" AS ENUM ('bride', 'groom');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('wedding', 'toy', 'betashar', 'kyz_uzatu', 'birthday', 'anniversary', 'corporate', 'other');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "language" "Language" NOT NULL DEFAULT 'ru',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTPToken" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTPToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameKz" TEXT NOT NULL,
    "descriptionRu" TEXT,
    "descriptionKz" TEXT,
    "category" "TemplateCategory" NOT NULL,
    "previewImageUrl" TEXT NOT NULL,
    "demoUrl" TEXT,
    "priceKzt" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventTime" TEXT,
    "eventPlace" TEXT,
    "eventTimezone" TEXT NOT NULL DEFAULT 'Asia/Almaty',
    "templateKey" TEXT NOT NULL DEFAULT 'classic',
    "templateData" JSONB NOT NULL DEFAULT '{}',
    "musicUrl" TEXT,
    "mapUrl" TEXT,
    "address" TEXT,
    "customText" JSONB NOT NULL DEFAULT '{}',
    "status" "InvitationStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "side" "GuestSide",
    "hasPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "plusOneName" TEXT,
    "guestToken" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "sentVia" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestResponse" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "status" "GuestResponseStatus" NOT NULL DEFAULT 'pending',
    "dietaryRestrictions" TEXT,
    "message" TEXT,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "invitationId" TEXT,
    "amountKzt" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KZT',
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "paymentProvider" TEXT,
    "paymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_phone_idx" ON "User"("phone");
CREATE INDEX "User_isAdmin_idx" ON "User"("isAdmin");

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_tokenHash_idx" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

CREATE INDEX "OTPToken_phone_idx" ON "OTPToken"("phone");
CREATE INDEX "OTPToken_expiresAt_idx" ON "OTPToken"("expiresAt");
CREATE INDEX "OTPToken_phone_usedAt_idx" ON "OTPToken"("phone", "usedAt");

CREATE UNIQUE INDEX "RateLimitEntry_key_key" ON "RateLimitEntry"("key");
CREATE INDEX "RateLimitEntry_key_idx" ON "RateLimitEntry"("key");
CREATE INDEX "RateLimitEntry_resetAt_idx" ON "RateLimitEntry"("resetAt");

CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");
CREATE INDEX "Template_slug_idx" ON "Template"("slug");
CREATE INDEX "Template_category_idx" ON "Template"("category");
CREATE INDEX "Template_isActive_idx" ON "Template"("isActive");
CREATE INDEX "Template_isFeatured_idx" ON "Template"("isFeatured");

CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");
CREATE INDEX "Invitation_userId_idx" ON "Invitation"("userId");
CREATE INDEX "Invitation_slug_idx" ON "Invitation"("slug");
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");
CREATE INDEX "Invitation_eventDate_idx" ON "Invitation"("eventDate");
CREATE INDEX "Invitation_templateId_idx" ON "Invitation"("templateId");
CREATE INDEX "Invitation_userId_status_idx" ON "Invitation"("userId", "status");
CREATE INDEX "Invitation_userId_createdAt_idx" ON "Invitation"("userId", "createdAt");

CREATE UNIQUE INDEX "Guest_guestToken_key" ON "Guest"("guestToken");
CREATE UNIQUE INDEX "Guest_invitationId_phone_key" ON "Guest"("invitationId", "phone");
CREATE INDEX "Guest_invitationId_idx" ON "Guest"("invitationId");
CREATE INDEX "Guest_phone_idx" ON "Guest"("phone");
CREATE INDEX "Guest_guestToken_idx" ON "Guest"("guestToken");

CREATE UNIQUE INDEX "GuestResponse_guestId_key" ON "GuestResponse"("guestId");
CREATE INDEX "GuestResponse_guestId_idx" ON "GuestResponse"("guestId");
CREATE INDEX "GuestResponse_status_idx" ON "GuestResponse"("status");

CREATE UNIQUE INDEX "Order_paymentProvider_paymentId_key" ON "Order"("paymentProvider", "paymentId");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_templateId_idx" ON "Order"("templateId");
CREATE INDEX "Order_invitationId_idx" ON "Order"("invitationId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Template" ADD CONSTRAINT "Template_pkey" PRIMARY KEY ("id");
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestResponse" ADD CONSTRAINT "GuestResponse_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
