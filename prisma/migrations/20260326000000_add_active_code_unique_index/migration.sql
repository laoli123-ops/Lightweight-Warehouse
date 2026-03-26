-- Partial unique index: only one active (unshipped) inbound record per warehouse code.
-- This is a database-level safety net against concurrent inbound submissions
-- for the same warehouse code. SQLite supports partial indexes since 3.8.0.
CREATE UNIQUE INDEX "inbound_records_unique_active_code"
ON "inbound_records" ("warehouse_code_id")
WHERE "outbound_status" = 'unshipped';
