ALTER TABLE "Content"
ADD COLUMN "publisherHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publisherHiddenReason" TEXT,
ADD COLUMN "publisherHiddenAt" TIMESTAMP(3);
