-- CreateTable
CREATE TABLE "TemplateWaitlistSignup" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateWaitlistSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateWaitlistSignup_slug_createdAt_idx" ON "TemplateWaitlistSignup"("slug", "createdAt");
