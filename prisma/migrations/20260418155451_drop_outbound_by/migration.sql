/*
  Warnings:

  - You are about to drop the column `outbound_by` on the `inbound_records` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_inbound_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serial_no" INTEGER NOT NULL,
    "inbound_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inbound_order_no" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "warehouse_code_id" INTEGER NOT NULL,
    "outbound_status" TEXT NOT NULL DEFAULT 'unshipped',
    "outbound_at" DATETIME,
    "inbound_name" TEXT,
    "inbound_phone" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inbound_records_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inbound_records_warehouse_code_id_fkey" FOREIGN KEY ("warehouse_code_id") REFERENCES "warehouse_codes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_inbound_records" ("created_at", "customer_id", "id", "inbound_name", "inbound_order_no", "inbound_phone", "inbound_time", "outbound_at", "outbound_status", "serial_no", "updated_at", "warehouse_code_id") SELECT "created_at", "customer_id", "id", "inbound_name", "inbound_order_no", "inbound_phone", "inbound_time", "outbound_at", "outbound_status", "serial_no", "updated_at", "warehouse_code_id" FROM "inbound_records";
DROP TABLE "inbound_records";
ALTER TABLE "new_inbound_records" RENAME TO "inbound_records";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
