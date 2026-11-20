ALTER TABLE event ADD COLUMN capacity INTEGER;
ALTER TABLE event ADD CONSTRAINT chk_event_capacity CHECK (capacity IS NULL OR capacity > 0);