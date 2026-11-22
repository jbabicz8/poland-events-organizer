ALTER TABLE event_image ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE event_image i
SET sort_order = numbered.pos
FROM (
         SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY id) - 1 AS pos
         FROM event_image
     ) numbered
WHERE i.id = numbered.id;