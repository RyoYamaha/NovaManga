ALTER TABLE "Content"
ADD COLUMN "purchaseMode" VARCHAR(20) NOT NULL DEFAULT 'whole';

ALTER TABLE "CreatorRevenue"
ALTER COLUMN "purchaseId" DROP NOT NULL,
ADD COLUMN "chapterPackPurchaseId" TEXT;

CREATE TABLE "ChapterPackPurchase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "packNumber" INTEGER NOT NULL,
  "priceCoins" INTEGER NOT NULL,
  "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChapterPackPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChapterPackPurchase_userId_contentId_packNumber_key"
ON "ChapterPackPurchase"("userId", "contentId", "packNumber");

CREATE INDEX "ChapterPackPurchase_contentId_packNumber_purchasedAt_idx"
ON "ChapterPackPurchase"("contentId", "packNumber", "purchasedAt");

CREATE UNIQUE INDEX "CreatorRevenue_chapterPackPurchaseId_key"
ON "CreatorRevenue"("chapterPackPurchaseId");

ALTER TABLE "ChapterPackPurchase"
ADD CONSTRAINT "ChapterPackPurchase_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ChapterPackPurchase"
ADD CONSTRAINT "ChapterPackPurchase_contentId_fkey"
FOREIGN KEY ("contentId") REFERENCES "Content"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "CreatorRevenue"
ADD CONSTRAINT "CreatorRevenue_chapterPackPurchaseId_fkey"
FOREIGN KEY ("chapterPackPurchaseId") REFERENCES "ChapterPackPurchase"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;
