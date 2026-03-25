-- CreateTable
CREATE TABLE "customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name_cn" TEXT NOT NULL,
    "name_pinyin" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_last4" TEXT NOT NULL,
    "search_text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "warehouse_codes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "area_code" TEXT NOT NULL,
    "seq_no" INTEGER NOT NULL,
    "warehouse_code" TEXT NOT NULL,
    "code_status" TEXT NOT NULL DEFAULT 'unused',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inbound_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serial_no" INTEGER NOT NULL,
    "inbound_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inbound_order_no" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "warehouse_code_id" INTEGER NOT NULL,
    "outbound_status" TEXT NOT NULL DEFAULT 'unshipped',
    "inbound_name" TEXT,
    "inbound_phone" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inbound_records_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inbound_records_warehouse_code_id_fkey" FOREIGN KEY ("warehouse_code_id") REFERENCES "warehouse_codes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_codes_warehouse_code_key" ON "warehouse_codes"("warehouse_code");
