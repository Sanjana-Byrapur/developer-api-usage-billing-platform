-- PROPOSED ONLY. Obtain approval and back up before applying.
-- The existing invoice_items.api_id is mandatory, which cannot describe a
-- subscription fee. Allow a NULL API for non-API charges, and add a label.
-- Existing rows and foreign keys are retained; no records are deleted.
-- Apply once against the intended MySQL database after reviewing its schema.
ALTER TABLE invoice_items
  MODIFY COLUMN api_id BIGINT NULL,
  ADD COLUMN description VARCHAR(255) NULL;
