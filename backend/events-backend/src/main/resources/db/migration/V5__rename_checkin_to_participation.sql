ALTER TABLE checkin RENAME TO participation;
ALTER TABLE event RENAME COLUMN checkin_count TO participant_count;