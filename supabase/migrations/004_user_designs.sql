-- Create user_designs table to store user tool designs
CREATE TABLE IF NOT EXISTS user_designs (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id TEXT NOT NULL,
  name TEXT NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  chain_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, design_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_designs_user_id ON user_designs(user_id);

-- Create index on design_id for lookups
CREATE INDEX IF NOT EXISTS idx_user_designs_design_id ON user_designs(design_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_designs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/write their own designs
CREATE POLICY "Users can view their own designs"
  ON user_designs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own designs"
  ON user_designs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs"
  ON user_designs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designs"
  ON user_designs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_designs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_user_designs_updated_at
  BEFORE UPDATE ON user_designs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_designs_updated_at();
