-- AlterTable
ALTER TABLE "inbound_records" ADD COLUMN "outbound_at" DATETIME;
ALTER TABLE "inbound_records" ADD COLUMN "outbound_by" TEXT;
