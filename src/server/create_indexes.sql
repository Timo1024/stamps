-- Indexes for stamps table
CREATE INDEX IF NOT EXISTS idx_stamps_set_id ON stamps(set_id);
CREATE INDEX IF NOT EXISTS idx_stamps_year_stamp_id ON stamps(stamp_id DESC);
CREATE INDEX IF NOT EXISTS idx_stamps_denomination ON stamps(denomination);
CREATE INDEX IF NOT EXISTS idx_stamps_description ON stamps(description);
CREATE INDEX IF NOT EXISTS idx_stamps_date_of_issue ON stamps(date_of_issue);

-- Indexes for sets table
CREATE INDEX IF NOT EXISTS idx_sets_country ON sets(country);
CREATE INDEX IF NOT EXISTS idx_sets_year ON sets(year DESC);
CREATE INDEX IF NOT EXISTS idx_sets_category ON sets(category);

-- Indexes for user_stamps table
CREATE INDEX IF NOT EXISTS idx_user_stamps_stamp_id ON user_stamps(stamp_id);
CREATE INDEX IF NOT EXISTS idx_user_stamps_user_id ON user_stamps(user_id);
